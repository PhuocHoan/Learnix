import { Body, Controller, Post } from '@nestjs/common';

// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Ideally protected, but for guest demo we might leave open or handle differently
import {
  CodeExecutionService,
  ExecutionRequest,
} from './code-execution.service';

@Controller('code-execution')
export class CodeExecutionController {
  constructor(private readonly codeExecutionService: CodeExecutionService) {}

  @Post('run')
  // @UseGuards(JwtAuthGuard) // deciding to leave public for now as per "guest student" demo context
  async execute(@Body() request: ExecutionRequest) {
    return await this.codeExecutionService.executeCode(request);
  }
}
