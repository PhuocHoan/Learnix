import { GoogleGenAI } from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeneratedQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  type: 'multiple_choice' | 'multi_select' | 'true_false' | 'short_answer';
}

@Injectable()
export class AiQuizGeneratorService {
  private readonly logger = new Logger(AiQuizGeneratorService.name);
  private genAI: GoogleGenAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }

  async generateQuizFromText(
    lessonText: string,
    numberOfQuestions = 5,
    preferredTypes: string[] = ['multiple_choice'],
  ): Promise<{ title: string; questions: GeneratedQuestion[] }> {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    const typesSentence =
      preferredTypes.length > 0
        ? `Use these question types: ${preferredTypes.join(', ')}.`
        : 'Use multiple-choice questions.';

    const prompt = `You are an expert educator. Based on the following lesson content, generate a suitable quiz title and exactly ${numberOfQuestions} questions to test student understanding.
    
${typesSentence}

Lesson Content:
${lessonText}

Requirements:
1. Generate exactly ${numberOfQuestions} questions.
2. Supported Types:
   - multiple_choice: 4 options (A: ..., B: ...), exactly ONE correct answer (e.g., "A").
   - multi_select: 4 options (A: ..., B: ...), ONE OR MORE correct answers (comma-separated, e.g., "A,C").
   - true_false: 2 options (A: True, B: False), exactly ONE correct answer (e.g., "A").
   - short_answer: No options, correctAnswer is a short text string.
3. Include an explanation for every correct answer.
4. Return ONLY a valid JSON object with this exact structure:
{
  "title": "Quiz Title",
  "questions": [
    {
      "questionText": "...",
      "type": "multiple_choice" | "multi_select" | "true_false" | "short_answer",
      "options": ["A: ...", "B: ..."], // Empty array for short_answer
      "correctAnswer": "A" | "Short answer text",
      "explanation": "..."
    }
  ]
}`;

    // Retry with exponential backoff
    const maxRetries = 3;
    let attempt = 0;

    const wait = (ms: number): Promise<void> =>
      new Promise((resolve) => setTimeout(resolve, ms));

    while (attempt < maxRetries) {
      try {
        const response = await this.genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        let content = response.text;

        if (!content) {
          throw new Error('No response from Gemini');
        }

        // Remove markdown code blocks if present
        content = content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        // Parse the JSON response
        const result: unknown = JSON.parse(content);

        // Validate the response structure
        let title = 'AI Generated Quiz';
        let questions: GeneratedQuestion[] = [];

        interface QuizResponse {
          title?: string;
          questions?: GeneratedQuestion[];
        }

        if (Array.isArray(result)) {
          // Fallback if AI ignores new structure
          questions = result as GeneratedQuestion[];
        } else if (
          typeof result === 'object' &&
          result !== null &&
          !Array.isArray(result)
        ) {
          const { title: resTitle, questions: resQuestions } =
            result as QuizResponse;
          if (resTitle) {
            title = resTitle;
          }
          if (Array.isArray(resQuestions)) {
            questions = resQuestions;
          }
        }

        if (questions.length === 0) {
          throw new Error('Invalid response format: No questions found');
        }

        // Enforce count limit strictly incase AI hallucinated more
        if (questions.length > numberOfQuestions) {
          questions = questions.slice(0, numberOfQuestions);
        }

        return { title, questions };
      } catch (error: unknown) {
        attempt++;

        this.logger.error(`Attempt ${attempt} failed:`, error);

        const status =
          typeof error === 'object' && error !== null && 'status' in error
            ? (error as { status: unknown }).status
            : undefined;

        // Check for 503 (Overloaded) or 429 (Quota)
        if (status === 503 || status === 429) {
          if (attempt >= maxRetries) {
            throw new Error(
              status === 429
                ? 'AI service quota exceeded. Please try again later.'
                : 'AI service is currently overloaded. Please try again later.',
            );
          }
          // Wait 2000 * 2^(attempt-1) ... e.g. 2000, 4000, 8000
          const delay = 2000 * Math.pow(2, attempt - 1);
          this.logger.warn(`Waiting ${delay}ms before retry...`);
          await wait(delay);
          continue;
        }

        // For other errors, throw immediately
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to generate quiz: ${errorMessage}`);
      }
    }

    throw new Error('Failed to generate quiz after multiple attempts.');
  }
}
