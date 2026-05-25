import React from 'react';
import TeacherManagement from './TeacherManagement';
import TeacherProfile from './TeacherProfile';

export default function DataGuruWrapper() {
  const role = localStorage.getItem('userRole');
  
  if (role === 'Guru') {
    return <TeacherProfile />;
  }
  
  return <TeacherManagement />;
}
