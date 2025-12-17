import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { GoogleGenAI } from '@google/genai';

export interface GeneratedQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

@Injectable()
export class AiQuizGeneratorService {
  private genAI: GoogleGenAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }

  async generateQuizFromText(
    lessonText: string,
    numberOfQuestions: number = 5,
  ): Promise<{ title: string; questions: GeneratedQuestion[] }> {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `You are an expert educator. Based on the following lesson content, generate a suitable quiz title and exactly ${numberOfQuestions} multiple-choice questions (MCQs) to test student understanding.

Lesson Content:
${lessonText}

Requirements:
1. Generate exactly ${numberOfQuestions} questions. Do not generate more or fewer.
2. Each question should have 4 options (A, B, C, D)
3. Only one option should be correct
4. Include an explanation for the correct answer
5. Questions should test understanding, not just memorization
6. Vary difficulty levels
7. Provide a catchy, relevant title for the quiz.

Return ONLY a valid JSON object with this exact structure, no markdown formatting:
{
  "title": "Quiz Title Here",
  "questions": [
    {
      "questionText": "What is...",
      "options": ["A: ...", "B: ...", "C: ...", "D: ..."],
      "correctAnswer": "A",
      "explanation": "..."
    }
  ]
}`;

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
      // It might be an array (old format) or object (new format).
      // We explicitly asked for object, but let's handle safety.

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
      console.error('Error generating quiz:', error);

      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? (error as { status: unknown }).status
          : undefined;

      if (status === 429) {
        throw new Error('AI service quota exceeded. Please try again later.');
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate quiz: ${errorMessage}`);
    }
  }
}
