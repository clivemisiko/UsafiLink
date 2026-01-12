import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

const Register = () => {
	const [formData, setFormData] = useState({
		username: '',
		email: '',
		password: '',
		confirmPassword: '',
		role: 'customer',
		phone_number: ''
	});
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (formData.password !== formData.confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}
		setLoading(true);
		try {
			await authAPI.register({
				username: formData.username,
				email: formData.email,
				password: formData.password,
				password2: formData.confirmPassword,
				role: formData.role,
				phone_number: formData.phone_number
			});
			toast.success('Registration successful! Please log in.');
			navigate('/login');
		} catch (error) {
			toast.error(
				error.response?.data?.detail ||
				error.response?.data?.username?.[0] ||
				error.response?.data?.email?.[0] ||
				'Registration failed'
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 py-12 px-4 sm:px-6 lg:px-8 animate-fadeIn">
			<div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-8 border border-blue-100">
				<div className="flex flex-col items-center">
					<div className="h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 shadow-lg animate-bounce-slow">
						<UserPlus className="h-8 w-8 text-white" />
					</div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-blue-700 drop-shadow-sm">
						Create a new account
					</h2>
					<p className="mt-2 text-center text-sm text-gray-500">
						Or{' '}
						<Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200">
							sign in to your account
						</Link>
					</p>
				</div>
				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div className="rounded-xl shadow-inner bg-blue-50/50 p-4 space-y-4">
						<div>
							<label htmlFor="username" className="block text-sm font-medium text-blue-700 mb-1">Username</label>
							<input
								id="username"
								name="username"
								type="text"
								autoComplete="username"
								required
								value={formData.username}
								onChange={handleChange}
								className="block w-full px-4 py-2 rounded-lg border border-blue-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
								placeholder="Username"
							/>
						</div>
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-blue-700 mb-1">Email address</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								value={formData.email}
								onChange={handleChange}
								className="block w-full px-4 py-2 rounded-lg border border-blue-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
								placeholder="Email address"
							/>
						</div>
						<div>
							<label htmlFor="phone_number" className="block text-sm font-medium text-blue-700 mb-1">Phone Number</label>
							<input
								id="phone_number"
								name="phone_number"
								type="text"
								autoComplete="tel"
								required
								value={formData.phone_number}
								onChange={handleChange}
								className="block w-full px-4 py-2 rounded-lg border border-blue-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
								placeholder="Phone Number"
							/>
						</div>
						<div>
							<label htmlFor="role" className="block text-sm font-medium text-blue-700 mb-1">Role</label>
							<select
								id="role"
								name="role"
								required
								value={formData.role}
								onChange={handleChange}
								className="block w-full px-4 py-2 rounded-lg border border-blue-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
							>
								<option value="customer">Customer</option>
								<option value="driver">Driver</option>
							</select>
						</div>
						<div>
							<label htmlFor="password" className="block text-sm font-medium text-blue-700 mb-1">Password</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="new-password"
								required
								value={formData.password}
								onChange={handleChange}
								className="block w-full px-4 py-2 rounded-lg border border-blue-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
								placeholder="Password"
							/>
						</div>
						<div>
							<label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-700 mb-1">Confirm Password</label>
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								autoComplete="new-password"
								required
								value={formData.confirmPassword}
								onChange={handleChange}
								className="block w-full px-4 py-2 rounded-lg border border-blue-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
								placeholder="Confirm Password"
							/>
						</div>
					</div>
					<div>
						<button
							type="submit"
							disabled={loading}
							className="group relative w-full flex justify-center py-2 px-4 text-base font-semibold rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50 transition-all duration-200"
						>
							{loading ? (
								<span className="flex items-center justify-center">
									<svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
									</svg>
									Registering...
								</span>
							) : 'Register'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Register;
