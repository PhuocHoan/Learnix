import { useEffect } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

export function LegacyLessonRedirect() {
  const { courseId, lessonId } = useParams<{
    courseId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (courseId && lessonId) {
      void navigate(`/courses/${courseId}/learn?lesson=${lessonId}`, {
        replace: true,
      });
    }
  }, [courseId, lessonId, navigate]);

  return null;
}
