import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import axios from 'axios';

import { ExercisesService } from './exercises.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ExercisesService', () => {
  let service: ExercisesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExercisesService],
    }).compile();

    service = module.get<ExercisesService>(ExercisesService);
    jest.clearAllMocks();
  });

  describe('executeCode', () => {
    it('should execute code via Piston API', async () => {
      const mockResult = {
        data: {
          run: {
            stdout: 'hello\n',
            stderr: '',
            code: 0,
            signal: null,
            output: 'hello\n',
          },
          language: 'javascript',
          version: '18.15.0',
        },
      };
      mockedAxios.post.mockResolvedValue(mockResult);

      const result = await service.executeCode(
        'javascript',
        'console.log("hello")',
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://emkc.org/api/v2/piston/execute',
        expect.objectContaining({
          language: 'javascript',
          files: [{ content: expect.stringContaining('console.log("hello")') }],
        }),
      );
      expect(result).toEqual(mockResult.data);
    });

    it('should append shims for typescript', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });

      await service.executeCode('typescript', 'const x: number = 10;');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://emkc.org/api/v2/piston/execute',
        expect.objectContaining({
          language: 'typescript',
          files: [{ content: expect.stringContaining('// Environment Shims') }],
        }),
      );
    });

    it('should throw BAD_GATEWAY if Piston API fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(service.executeCode('javascript', 'code')).rejects.toThrow(
        new HttpException(
          'Failed to execute code service',
          HttpStatus.BAD_GATEWAY,
        ),
      );
    });
  });

  describe('validateSubmission', () => {
    it('should return success if exit code is 0 when testCode is provided', async () => {
      const mockResult = {
        data: {
          run: { output: 'Tests passed', code: 0 },
        },
      };
      mockedAxios.post.mockResolvedValue(mockResult);

      const result = await service.validateSubmission(
        'javascript',
        'const x = 1;',
        'Tests passed',
        'if(x!==1) throw new Error();',
      );

      expect(result).toEqual({
        success: true,
        output: 'Tests passed',
      });
    });

    it('should return failure if exit code is not 0 when testCode is provided', async () => {
      const mockResult = {
        data: {
          run: { output: 'Assertion failed', code: 1 },
        },
      };
      mockedAxios.post.mockResolvedValue(mockResult);

      const result = await service.validateSubmission(
        'javascript',
        'const x = 2;',
        'Tests passed',
        'if(x!==1) throw new Error();',
      );

      expect(result).toEqual({
        success: false,
        output: 'Assertion failed',
      });
    });

    it('should validate by string matching if no testCode is provided', async () => {
      const mockResult = {
        data: {
          run: { output: 'hello\n', code: 0 },
        },
      };
      mockedAxios.post.mockResolvedValue(mockResult);

      const result = await service.validateSubmission(
        'javascript',
        'code',
        'hello',
      );

      expect(result.success).toBe(true);
      expect(result.output).toBe('hello');
    });

    it('should return failure if criteria are missing', async () => {
      const result = await service.validateSubmission('javascript', 'code');
      expect(result.success).toBe(false);
      expect(result.output).toBe('No validation criteria provided');
    });
  });
});
