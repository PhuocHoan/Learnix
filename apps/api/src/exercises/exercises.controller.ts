import { Controller, Post, Body, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ExercisesService, ExecutionResult } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post('execute')
  // @UseGuards(JwtAuthGuard) // Optional: restrict to logged in users to prevent abuse
  async execute(
    @Body() body: { language: string; code: string; stdin?: string },
  ): Promise<ExecutionResult> {
    return await this.exercisesService.executeCode(
      body.language,
      body.code,
      body.stdin,
    );
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  async submit(
    @Body()
    body: {
      language: string;
      code: string;
      expectedOutput?: string;
      testCode?: string;
    },
  ): Promise<{ success: boolean; output: string }> {
    return await this.exercisesService.validateSubmission(
      body.language,
      body.code,
      body.expectedOutput,
      body.testCode,
    );
  }
}
