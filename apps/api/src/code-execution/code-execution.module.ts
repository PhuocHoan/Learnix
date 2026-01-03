import { Module } from '@nestjs/common';

import { CodeExecutionController } from './code-execution.controller';
import { CodeExecutionService } from './code-execution.service';

@Module({
  controllers: [CodeExecutionController],
  providers: [CodeExecutionService],
})
export class CodeExecutionModule {}
