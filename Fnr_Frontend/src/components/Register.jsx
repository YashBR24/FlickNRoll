// import React, { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { FaTableTennis, FaRegFutbol } from 'react-icons/fa';
// import '../context/login.css';
// import { register as apiRegister } from '../utils/api';

// const Register = () => {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setSuccess('');
//     try {
//       const response = await apiRegister({ name, email, password });
//       const { data } = response;
//       setSuccess('Registration successful! Please check your email to verify your account.');
//       setTimeout(() => navigate('/login'), 5000);
//     } catch (error) {
//       setError(error.response?.data?.message || 'An error occurred during registration');
//     }
//   };

//   return (
//     <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[#292333]">
//       <div className="pickleball-container hidden lg:block">
//         <img src="src/assets/ball3.png" alt="Pickleball Ball" className="pickleball" />
//       </div>
//       <div className="w-full max-w-md p-8 relative">
//         <div className="text-center mb-8 transform transition-transform">
//           <div className="inline-block mb-4">
//             <img src="src/assets/fnr_cropped.jpg" alt="Flick N Roll Logo" />
//           </div>
//         </div>
//         {error && (
//           <div className="mb-4 p-3 rounded-lg bg-red-500/20 backdrop-blur-sm text-white text-center border border-red-500/30">
//             {error}
//           </div>
//         )}
//         {success && (
//           <div className="mb-4 p-3 rounded-lg bg-green-500/20 backdrop-blur-sm text-white text-center border border-green-500/30">
//             {success}
//           </div>
//         )}
//         <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
//           <div className="space-y-2">
//             <div className="relative flex items-center">
//               <FaRegFutbol className="absolute left-3 text-gray-400 text-lg" />
//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 className="w-full px-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all hover:bg-white/20"
//                 placeholder="Name"
//                 required
//               />
//             </div>
//           </div>
//           <div className="space-y-2">
//             <div className="relative flex items-center">
//               <FaRegFutbol className="absolute left-3 text-gray-400 text-lg" />
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="w-full px-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all hover:bg-white/20"
//                 placeholder="Email"
//                 required
//               />
//             </div>
//           </div>
//           <div className="space-y-2">
//             <div className="relative flex items-center">
//               <FaTableTennis className="absolute left-3 text-gray-400 text-lg" />
//               <input
//                 type="password"
//                 placeholder="Password"
//                 className="w-full px-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all hover:bg-white/20"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>
//           </div>
//           <button
//             type="submit"
//             className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md border border-white/20 hover:border-white/40 transform hover:scale-105"
//           >
//             Sign Up
//           </button>
//         </form>
//         <div className="text-center mt-4">
//           <p className="text-white">
//             Already have an account?{' '}
//             <Link to="/login" className="text-white underline hover:text-gray-300">
//               Sign In
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaTableTennis, FaRegFutbol, FaPhone, FaCalendarAlt, FaVenusMars, FaLock } from 'react-icons/fa';
import '../context/login.css';
import { register as apiRegister } from '../utils/api';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await apiRegister({ 
        name, 
        email, 
        phoneNumber, 
        gender, 
        dateOfBirth, 
        password ,
        confirmPassword
      });
      const { data } = response;
      setSuccess('Registration successful! Please check your email to verify your account.');
      setTimeout(() => navigate('/login'), 5000);
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred during registration');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[#292333]">
      <div className="pickleball-container absolute left-0 bottom-0 z-0">
        <img src="src/assets/ball3.png" alt="Pickleball Ball" className="w-[300px] h-[300px] opacity-90" />
      </div>
      
      <div className="w-full max-w-3xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <img src="src/assets/fnr_cropped.jpg" alt="Flick N Roll Logo" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">SIGN UP</h1>
        </div>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 backdrop-blur-sm text-white text-center border border-red-500/30">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/20 backdrop-blur-sm text-white text-center border border-green-500/30">
            {success}
          </div>
        )}
        
        <div className="bg-[#1e1a29]/80 backdrop-blur-md rounded-xl border border-[#ffffff20] shadow-xl p-8">
          <form onSubmit={handleSubmit} className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div className="space-y-1">
                <label className="text-white text-sm font-medium">Name</label>
                <div className="relative flex items-center">
                  <FaRegFutbol className="absolute left-3 text-[#ffc107] text-lg" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-10 py-3 bg-[#ffffff10] border border-[#ffffff30] rounded-lg text-white placeholder-[#ffffff60] focus:outline-none focus:ring-2 focus:ring-[#ffc107] focus:border-transparent transition-all hover:bg-[#ffffff20]"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>
              
              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-white text-sm font-medium">Email</label>
                <div className="relative flex items-center">
                  <FaRegFutbol className="absolute left-3 text-[#ffc107] text-lg" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-10 py-3 bg-[#ffffff10] border border-[#ffffff30] rounded-lg text-white placeholder-[#ffffff60] focus:outline-none focus:ring-2 focus:ring-[#ffc107] focus:border-transparent transition-all hover:bg-[#ffffff20]"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              
              {/* Phone Number Field */}
              <div className="space-y-1">
                <label className="text-white text-sm font-medium">Phone Number</label>
                <div className="relative flex items-center">
                  <FaPhone className="absolute left-3 text-[#ffc107] text-lg" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-10 py-3 bg-[#ffffff10] border border-[#ffffff30] rounded-lg text-white placeholder-[#ffffff60] focus:outline-none focus:ring-2 focus:ring-[#ffc107] focus:border-transparent transition-all hover:bg-[#ffffff20]"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>
              
              {/* Gender Field */}
              <div className="space-y-1">
                <label className="text-white text-sm font-medium">Gender</label>
                <div className="relative flex items-center">
                  <FaVenusMars className="absolute left-3 text-[#ffc107] text-lg" />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-10 py-3 bg-[#ffffff10] border border-[#ffffff30] rounded-lg text-white placeholder-[#ffffff60] focus:outline-none focus:ring-2 focus:ring-[#ffc107] focus:border-transparent transition-all hover:bg-[#ffffff20] appearance-none"
                    required
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Date of Birth Field - Full Width */}
            <div className="space-y-1 mt-6">
              <label className="text-white text-sm font-medium">Date of Birth</label>
              <div className="relative flex items-center">
                <FaCalendarAlt className="absolute left-3 text-[#ffc107] text-lg" />
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-10 py-3 bg-[#ffffff10] border border-[#ffffff30] rounded-lg text-white placeholder-[#ffffff60] focus:outline-none focus:ring-2 focus:ring-[#ffc107] focus:border-transparent transition-all hover:bg-[#ffffff20]"
                  placeholder="dd-mm-yyyy"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-white text-sm font-medium">Password</label>
                <div className="relative flex items-center">
                  <FaTableTennis className="absolute left-3 text-[#ffc107] text-lg" />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full px-10 py-3 bg-[#ffffff10] border border-[#ffffff30] rounded-lg text-white placeholder-[#ffffff60] focus:outline-none focus:ring-2 focus:ring-[#ffc107] focus:border-transparent transition-all hover:bg-[#ffffff20]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="text-white text-sm font-medium">Confirm Password</label>
                <div className="relative flex items-center">
                  <FaLock className="absolute left-3 text-[#ffc107] text-lg" />
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    className="w-full px-10 py-3 bg-[#ffffff10] border border-[#ffffff30] rounded-lg text-white placeholder-[#ffffff60] focus:outline-none focus:ring-2 focus:ring-[#ffc107] focus:border-transparent transition-all hover:bg-[#ffffff20]"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-xs text-white/70 text-center">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="text-[#ffc107] hover:text-[#ffcd38] transition-colors">
                Terms & Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-[#ffc107] hover:text-[#ffcd38] transition-colors">
                Privacy Policy
              </Link>
            </div>
            
            <button
              type="submit"
              className="w-full mt-6 py-3 px-4 bg-[#ffc107] hover:bg-[#ffcd38] text-[#292333] font-bold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#ffc107]/50 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Sign Up
            </button>
          </form>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-white">
            Already have an account?{' '}
            <Link to="/login" className="text-[#ffc107] hover:text-[#ffcd38] font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;