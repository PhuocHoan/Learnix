/* eslint-disable security/detect-object-injection */
import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

// Define schemas
const configSchema = z.object({
    lessonIds: z.array(z.string()).min(1, 'Select at least one lesson'),
    count: z.number().min(1).max(20),
    topic: z.string().optional(),
});

type ConfigFormValues = z.infer<typeof configSchema>;

interface GeneratedQuestion {
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

interface QuizGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    sectionId: string;
    lessons: { id: string; title: string }[];
    onSave: (data: { questions: GeneratedQuestion[]; title: string }) => void;
}

export function QuizGenerationModal({
    isOpen,
    onClose,
    courseId,
    sectionId,
    lessons,
    onSave,
}: QuizGenerationModalProps) {
    const [step, setStep] = useState<'config' | 'preview'>('config');
    const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
    const [title, setTitle] = useState<string>('');

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ConfigFormValues>({
        resolver: zodResolver(configSchema),
        defaultValues: {
            lessonIds: [],
            count: 5,
        },
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const selectedLessonIds = watch('lessonIds');

    const generateMutation = useMutation({
        mutationFn: async (data: ConfigFormValues) => {
            const response = await api.post(
                `/courses/${courseId}/sections/${sectionId}/generate-quiz-preview`,
                data,
            );
            return response.data as { title: string; questions: GeneratedQuestion[] } | GeneratedQuestion[];
        },
        onSuccess: (data) => {
            // Handle new response format { title, questions }
            if ('questions' in data && Array.isArray(data.questions)) {
                setQuestions(data.questions);
                setTitle(data.title || '');
            } else if (Array.isArray(data)) {
                // Fallback for old API behavior
                setQuestions(data);
                setTitle('');
            }
            setStep('preview');
        },
        onError: () => {
            toast.error('Failed to generate quiz. Please try again.');
        },
    });

    const handleConfigSubmit = (data: ConfigFormValues) => {
        generateMutation.mutate(data);
    };

    const handleLessonToggle = (lessonId: string) => {
        const current = selectedLessonIds;
        const next = current.includes(lessonId)
            ? current.filter((id) => id !== lessonId)
            : [...current, lessonId];
        setValue('lessonIds', next, { shouldValidate: true });
    };

    const handleQuestionChange = <K extends keyof GeneratedQuestion>(
        index: number,
        field: K,
        value: GeneratedQuestion[K],
    ) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        const newOptions = [...newQuestions[qIndex].options];
        newOptions[oIndex] = value;
        newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
        setQuestions(newQuestions);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        // We actually need to map the answer to the correct option index/text
        // Heuristic: If the generated answer is "A", map to options[0].

        const finalQuestions = questions.map(q => {
            // Simple heuristic to map generic A/B/C/D to actual text
            let correctOptionIndex = 0;
            if (q.correctAnswer.includes('B')) { correctOptionIndex = 1; }
            if (q.correctAnswer.includes('C')) { correctOptionIndex = 2; }
            if (q.correctAnswer.includes('D')) { correctOptionIndex = 3; }

            return {
                questionText: q.questionText,
                options: q.options.map(o => o.replace(/^[A-D]:\s*/, '')), // Clean "A: " prefixes
                correctAnswer: q.options[correctOptionIndex]?.replace(/^[A-D]:\s*/, '') || q.options[0],
                explanation: q.explanation,
                type: 'multiple-choice',
                position: 0
            };
        });

        onSave({ questions: finalQuestions, title });
        onClose();
    };
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Generate Quiz with AI</DialogTitle>
                    <DialogDescription>
                        {step === 'config'
                            ? 'Select source material and configure generation settings.'
                            : 'Review and edit the generated questions before saving.'}
                    </DialogDescription>
                </DialogHeader>

                {step === 'config' && (
                    <form
                        id="config-form"
                        onSubmit={handleSubmit(handleConfigSubmit)}
                        className="space-y-6 flex-1 overflow-y-auto p-1"
                    >
                        <div className="space-y-4">
                            <Label>Source Content (Select Lessons)</Label>
                            <div className="border rounded-md p-4 space-y-3 max-h-60 overflow-y-auto">
                                {lessons.length === 0 && <p className="text-sm text-muted-foreground">No lessons available in this section.</p>}
                                {lessons.map((lesson) => (
                                    <div key={lesson.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={selectedLessonIds.includes(lesson.id)}
                                            onChange={() => handleLessonToggle(lesson.id)}
                                        />
                                        <span className="text-sm">{lesson.title}</span>
                                    </div>
                                ))}
                            </div>
                            {errors.lessonIds && (
                                <p className="text-sm text-destructive">
                                    {errors.lessonIds.message}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Number of Questions</Label>
                                <Input
                                    type="number"
                                    {...register('count', { valueAsNumber: true })}
                                />
                                {errors.count && (
                                    <p className="text-sm text-destructive">
                                        {errors.count.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Topic / Focus (Optional)</Label>
                                <Input
                                    placeholder="e.g. React Hooks, State Management"
                                    {...register('topic')}
                                />
                            </div>
                        </div>
                    </form>
                )}

                {step === 'preview' && (
                    <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                        <div className="space-y-2">
                            <Label>Quiz Title</Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter quiz title"
                            />
                        </div>
                        {questions.map((q, qIndex) => (
                            <Card key={qIndex} className="relative group">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                    onClick={() => removeQuestion(qIndex)}
                                >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                                <CardContent className="p-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Question {qIndex + 1}</Label>
                                        <Textarea
                                            value={q.questionText}
                                            onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                                            className="font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {q.options.map((opt, oIndex) => (
                                            <div key={oIndex} className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Option {['A', 'B', 'C', 'D'][oIndex]}</Label>
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        name={`correct-${qIndex}`}
                                                        checked={q.correctAnswer.startsWith(['A', 'B', 'C', 'D'][oIndex] ?? '')}
                                                        onChange={() => handleQuestionChange(qIndex, 'correctAnswer', ['A', 'B', 'C', 'D'][oIndex] ?? 'A')}
                                                        className="w-4 h-4 text-primary"
                                                    />
                                                    <Input
                                                        value={opt}
                                                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Explanation</Label>
                                        <Textarea
                                            value={q.explanation}
                                            onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                                            className="text-sm text-muted-foreground min-h-[60px]"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <DialogFooter className="mt-4 pt-2 border-t">
                    {step === 'config' ? (
                        <>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="config-form"
                                disabled={generateMutation.isPending}
                            >
                                {generateMutation.isPending && (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                Generate Preview
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setStep('config')}>Back to Config</Button>
                            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                                Looks Good, Create Quiz
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
