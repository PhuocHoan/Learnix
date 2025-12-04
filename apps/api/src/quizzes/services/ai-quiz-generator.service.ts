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
  ): Promise<GeneratedQuestion[]> {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `You are an expert educator. Based on the following lesson content, generate ${numberOfQuestions} multiple-choice questions (MCQs) to test student understanding.

Lesson Content:
${lessonText}

Requirements:
1. Each question should have 4 options (A, B, C, D)
2. Only one option should be correct
3. Include an explanation for the correct answer
4. Questions should test understanding, not just memorization
5. Vary difficulty levels

Return ONLY a valid JSON array with this exact structure, no markdown formatting:
[
  {
    "questionText": "What is...",
    "options": ["A: First option", "B: Second option", "C: Third option", "D: Fourth option"],
    "correctAnswer": "A",
    "explanation": "The correct answer is A because..."
  }
]`;

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
      const questions: unknown = JSON.parse(content);

      // Validate the response structure
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid response format from Gemini');
      }

      return questions as GeneratedQuestion[];
    } catch (error) {
      console.error('Error generating quiz:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate quiz: ${errorMessage}`);
    }
  }
}
