import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clipboard, Clock, BarChart3 } from 'lucide-react';

const cards = [
  { title: 'Courses', path: '/study/courses', icon: BookOpen, description: 'Track courses and progress.' },
  { title: 'Assignments', path: '/study/assignments', icon: Clipboard, description: 'Manage due dates and grades.' },
  { title: 'Exams', path: '/study/exams', icon: Clock, description: 'Countdown to exams.' },
  { title: 'Study Sessions', path: '/study/sessions', icon: BarChart3, description: 'Log and review study time.' },
];

export default function Study() {
  return (
    <>
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-[#0A1628]">Academic Hub</h1>
          <p className="text-sm text-[#4A6080] mt-0.5">Manage courses, assignments, exams, and study sessions.</p>
        </div>
      </div>

      {/* CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.path}
              className="group bg-white border border-[#E8F4F8] rounded-xl p-6 hover:border-[#00B4D8] hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <Icon size={20} className="text-[#00B4D8]" strokeWidth={1.5} />
              </div>
              <h2 className="text-sm font-semibold text-[#0A1628] group-hover:text-[#00B4D8] transition-colors">{card.title}</h2>
              <p className="mt-2 text-xs text-[#8BA3B8]">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
