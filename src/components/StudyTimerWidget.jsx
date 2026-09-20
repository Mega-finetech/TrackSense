import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../services/api';
import { useUIStore } from '../stores';

const formatDuration = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hrs, mins, secs]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
};

export default function StudyTimerWidget() {
  const studyTimer = useUIStore((state) => state.studyTimer);
  const startStudyTimer = useUIStore((state) => state.startStudyTimer);
  const stopStudyTimer = useUIStore((state) => state.stopStudyTimer);
  const [seconds, setSeconds] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');

  useEffect(() => {
    if (!studyTimer) return;

    const updateSeconds = () => {
      const elapsed = Math.floor((Date.now() - studyTimer.startTimestamp) / 1000);
      setSeconds(elapsed);
    };

    updateSeconds();
    const interval = setInterval(updateSeconds, 1000);
    return () => clearInterval(interval);
  }, [studyTimer]);

  useEffect(() => {
    if (!studyTimer) {
      setSeconds(0);
    }
  }, [studyTimer]);

  const handleOpen = (prefillSubject = '') => {
    setSubjectInput(prefillSubject);
    setOpenModal(true);
  };

  const handleStart = () => {
    if (!subjectInput.trim()) return;
    startStudyTimer(subjectInput.trim());
    setOpenModal(false);
  };

  const handleStop = async () => {
    if (!studyTimer) return;
    const elapsedSeconds = Math.max(1, Math.floor((Date.now() - studyTimer.startTimestamp) / 1000));
    const durationMinutes = Math.ceil(elapsedSeconds / 60);
    const payload = {
      subject: studyTimer.subject,
      duration_minutes: durationMinutes,
      session_date: new Date().toISOString().split('T')[0],
      notes: 'Auto-logged from study timer',
    };

    try {
      await apiClient.post('/study-sessions', payload);
    } catch (error) {
      console.error('Unable to save study session from timer', error);
    } finally {
      stopStudyTimer();
    }
  };

  return (
    <>
      <div className="fixed bottom-24 right-4 sm:bottom-4 sm:right-4 z-50 flex flex-col items-end space-y-3">
        {studyTimer ? (
          <div className="w-80 rounded-2xl bg-white border border-purple-200 shadow-lg p-4 text-left">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-gray-500">Currently Studying</div>
                <div className="font-semibold text-lg">{studyTimer.subject}</div>
              </div>
              <div className="text-sm text-purple-600">{formatDuration(seconds)}</div>
            </div>
            <button
              onClick={handleStop}
              className="w-full rounded-xl bg-red-600 px-3 py-2 text-white text-sm font-semibold hover:bg-red-700"
            >
              Stop & Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleOpen('')}
            className="rounded-full bg-purple-600 px-4 py-3 text-white font-semibold shadow-lg hover:bg-purple-700"
          >
            Start Study Timer
          </button>
        )}
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl h-full sm:h-auto overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Start Study Timer</h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              placeholder="Enter study subject"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="rounded-2xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStart}
                className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
              >
                Start Timer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
