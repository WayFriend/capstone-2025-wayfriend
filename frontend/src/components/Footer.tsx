import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-gray text-white">
      <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
        <div className="mb-4 md:mb-0">
          <span className="text-lg font-bold">Way Friends</span>
          <p className="text-sm text-gray-500 mt-1">&copy; 2025 Way Friends. All rights reserved.</p>
        </div>
        <div className="flex space-x-6">
          <a href="#" className="text-gray-400 hover:text-white transition-colors">서비스 소개</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">문의하기</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">개인정보처리방침</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



