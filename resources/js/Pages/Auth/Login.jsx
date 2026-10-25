import { Head } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';


export default function Login() {
   return (
      <>
      {/*Page Title */}
      <Head title='Login' />
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px6 lg:px-8"> {/* Main container */}
         <div className="bg-white py-10 px-4 shadow sm:rounded-lg sm:px-10 sm:mx-auto sm:w-full sm:max-w-lg">
            {/* Henann Logo Placeholder */}
            <div className="text-center">
               <p className="text-indigo-600 block font-bold">AssetPulse</p>
              <p className="text-indigo-600 text-lg font-semibold">IT Inventory & Asset Management System</p>
            </div>
            <h2 className="text-center mt-6 text-2xl font-semibold text-gray-900">
               Account Login
            </h2>

         {/* Login Form Container */}
            <div className="mt-10 text-center sm:mx-auto sm:w-full sm:max-w-md">
                  <form className="space-y-6" action="#" method="POST">
                     {/* Username or Email Input Field */}
                     <div>
                        <InputLabel htmlFor="username" className="block text-left text-sm font-medium text-gray-700">
                           Username or Email
                        </InputLabel>
                        <div className="mt-1">
                           <input id="username" type="text" placeholder="Enter username or email" autoComplete='username' required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out" />
                        </div>
                     </div>

                     {/* Password Input Field */}
                     <div>
                        <InputLabel htmlFor="password" className="block text-left text-sm font-medium text-gray-700">
                           Password
                        </InputLabel>
                        <div className="mt-1">
                           <input id="password" type="password" placeholder="Enter password" required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out" />
                        </div>
                     </div>

                     {/* Remember Me Checkbox */}
                     <div className="flex items-center justify-between">
                        <div className="flex items-center">
                           <input id="remember-me" type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"    />
                           <InputLabel htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                              Remember Me
                           </InputLabel>
                        </div>
                     </div>

                     {/* Submit PrimaryButton */}
                     <div>
                        <PrimaryButton type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-smfont-medium text-white bg-blue-600 hover:bg-indigo-800 focus:outline-none focus-ring-2 focus:ring-offset-2 focus:ring-indigo-500 duration-150 ease-in-out">
                           Login
                        </PrimaryButton>
                     </div>
                  </form>
            </div>
         </div>

         <div className="flex flex-col items-center mt-6 text-center text-gray-500 text-sm sm:mx-auto sm:w-full sm:maxw-md">
            <p>&copy; John Jerald Eriman. All rights reserved.</p>
            <p>Developed by ChoLogic-tech <br></br> <a href="https://github.com/ChoLogic-Tech" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800"> https://github.com/ChoLogic-Tech </a></p>
         </div>
      </div>
      </>
   )
}
