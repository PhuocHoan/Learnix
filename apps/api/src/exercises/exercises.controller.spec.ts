import { Test, type TestingModule } from '@nestjs/testing';

import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';

describe('ExercisesController', () => {
  let controller: ExercisesController;
  let service: jest.Mocked<ExercisesService>;

  beforeEach(async () => {
    const mockExercisesService = {
      executeCode: jest.fn(),
      validateSubmission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExercisesController],
      providers: [
        {
          provide: ExercisesService,
          useValue: mockExercisesService,
        },
      ],
    }).compile();

    controller = module.get<ExercisesController>(ExercisesController);
    service = module.get(ExercisesService);
  });

  describe('execute', () => {
    it('should call service.executeCode', async () => {
      const body = { language: 'js', code: 'print(1)', stdin: 'input' };
      const mockResult = { run: { output: '1' } } as any;
      service.executeCode.mockResolvedValue(mockResult);

      const result = await controller.execute(body);

      expect(service.executeCode).toHaveBeenCalledWith(
        'js',
        'print(1)',
        'input',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('submit', () => {
    it('should call service.validateSubmission', async () => {
      const body = {
        language: 'js',
        code: '1',
        expectedOutput: '1',
        testCode: 'test',
      };
      const mockResult = { success: true, output: '1' };
      service.validateSubmission.mockResolvedValue(mockResult);

      const result = await controller.submit(body);

      expect(service.validateSubmission).toHaveBeenCalledWith(
        'js',
        '1',
        '1',
        'test',
      );
      expect(result).toEqual(mockResult);
    });
  });
});
