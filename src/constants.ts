export const SCHOOL_NAME = import.meta.env.VITE_SCHOOL_NAME || localStorage.getItem('school_name') || 'Rasyatech';

export const getSchoolParts = () => {
  const parts = SCHOOL_NAME.split(' ');
  return {
    first: parts[0] || 'Rasya',
    rest: parts.slice(1).join(' ') || 'Tech'
  };
};
