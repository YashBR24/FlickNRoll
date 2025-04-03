// import React, { useState, useEffect } from 'react';
// import { useNavigate, Link, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { FaTableTennis, FaRegFutbol } from 'react-icons/fa';
// import '../context/login.css';

// const Login = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const { login, isAuthenticated } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   useEffect(() => {
//     if (isAuthenticated && location.pathname !== '/login') {
//       navigate('/dashboard');
//     }
//   }, [isAuthenticated, navigate, location.pathname]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     try {
//       const success = await login({ email, password });
//       if (!success) {
//         setError('Invalid email or password');
//       } else {
//         navigate('/dashboard');
//       }
//     } catch (err) {
//       // Check for specific error messages from the auth controller
//       if (err.message.includes('Too many failed attempts')) {
//         setError('Too many failed attempts. Account blocked for 1 hour');
//       } else if (err.message.includes('temporarily blocked')) {
//         const remainingTime = err.message.match(/after (\d+) minutes/);
//         setError(remainingTime 
//           ? `Account is temporarily blocked. Please try again after ${remainingTime[1]} minutes`
//           : 'Account is temporarily blocked. Please try again later');
//       } else {
//         setError('An error occurred during login');
//       }
//       console.error('Login error:', err);
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
//         <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
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
//           <div className="text-right">
//             <Link 
//               to="/forgot-password" 
//               className="text-white hover:text-gray-300 text-sm"
//             >
//               Forgot Password?
//             </Link>
//           </div>
//           <button
//             type="submit"
//             className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md border border-white/20 hover:border-white/40 transform hover:scale-105"
//           >
//             Sign In
//           </button>
//         </form>
//         <div className="text-center mt-4 space-y-2">
//           <p className="text-white">
//             Don’t have an account?{' '}
//             <Link to="/register" className="text-white underline hover:text-gray-300">
//               Sign Up
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;

import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaTableTennis, FaRegFutbol } from 'react-icons/fa';
import '../context/login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && location.pathname !== '/login') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const success = await login({ email, password });
      if (!success) {
        setError('Invalid email or password');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      // Check for specific error messages from the auth controller
      if (err.message.includes('Too many failed attempts')) {
        setError('Too many failed attempts. Account blocked for 1 hour');
      } else if (err.message.includes('temporarily blocked')) {
        const remainingTime = err.message.match(/after (\d+) minutes/);
        setError(remainingTime 
          ? `Account is temporarily blocked. Please try again after ${remainingTime[1]} minutes`
          : 'Account is temporarily blocked. Please try again later');
      } else {
        setError('An error occurred during login');
      }
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[#292333]">
      <div className="pickleball-container absolute left-0 bottom-0 z-0">
        <img src="src/assets/ball3.png" alt="Pickleball Ball" className="w-[300px] h-[300px] opacity-90" />
      </div>
      
      <div className="w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <img src="src/assets/fnr_cropped.jpg" alt="Flick N Roll Logo" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">SIGN IN</h1>
        </div>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 backdrop-blur-sm text-white text-center border border-red-500/30">
            {error}
          </div>
        )}
        
        <div className="bg-[#1e1a29]/80 backdrop-blur-md rounded-xl border border-[#ffffff20] shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
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
            
            <div className="text-right">
              <Link 
                to="/forgot-password" 
                className="text-[#ffc107] hover:text-[#ffcd38] text-sm transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#ffc107] hover:bg-[#ffcd38] text-[#292333] font-bold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#ffc107]/50 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Sign In
            </button>
          </form>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-white">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#ffc107] hover:text-[#ffcd38] font-medium transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;