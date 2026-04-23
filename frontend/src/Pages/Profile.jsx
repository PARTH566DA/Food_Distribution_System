import { useEffect, useState } from "react";
import { saveSession, updateProfile } from "../api/auth";

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const NAME_REGEX = /^[A-Za-z ]+$/;

const Profile = ({ user, onClose, onLogout, onProfileSaved }) => {
	if (!user) return null;

	const [name, setName] = useState(user.userName || "");
	const [mobile, setMobile] = useState(user.mobileNumber || "");
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		setName(user.userName || "");
		setMobile(user.mobileNumber || "");
		setError("");
		setSuccess("");
		setIsEditing(false);
	}, [user]);

	const handleSave = async () => {
		const trimmedName = name.trim();
		const mobileDigits = mobile.replace(/\D/g, "");

		if (trimmedName.length < 2) {
			setError("Name must be at least 2 characters.");
			return;
		}

		if (!NAME_REGEX.test(trimmedName)) {
			setError("Name should contain only letters and spaces.");
			return;
		}

		if (!MOBILE_REGEX.test(mobileDigits)) {
			setError("Mobile number must be exactly 10 digits and start with 6, 7, 8, or 9.");
			return;
		}

		setIsSaving(true);
		setError("");
		setSuccess("");

		try {
			const response = await updateProfile(trimmedName, mobileDigits);
			const updatedAuthData = response?.data;

			if (!updatedAuthData) {
				throw new Error("Server did not return updated profile data.");
			}

			saveSession(updatedAuthData);
			onProfileSaved?.({
				userId: updatedAuthData.userId,
				userName: updatedAuthData.userName,
				emailId: updatedAuthData.emailId,
				mobileNumber: updatedAuthData.mobileNumber,
				role: updatedAuthData.role,
			});

			setIsEditing(false);
			setSuccess(response?.message || "Profile updated successfully.");
		} catch (err) {
			setError(err?.message || "Could not update profile.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		setName(user.userName || "");
		setMobile(user.mobileNumber || "");
		setError("");
		setSuccess("");
		setIsEditing(false);
	};

	return (
		<div className="w-full h-full p-6 flex flex-col">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-bold text-[#6B5454]">Profile</h2>
				<button
					type="button"
					onClick={onClose}
					className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FED0CB] transition-colors"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={2}
						stroke="#6B5454"
						className="w-6 h-6"
					>
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div className="flex-1 overflow-y-auto rounded-2xl border border-[#F4DDD8] bg-[#FFF8F7] p-4">
				<div className="rounded-2xl border border-[#F0D9D3] bg-white p-4">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-full bg-[#FED0CB] flex items-center justify-center shrink-0">
							<span className="text-lg font-bold text-[#FF8B77]">
								{user.userName?.charAt(0)?.toUpperCase() || "U"}
							</span>
						</div>
						<div>
							<p className="text-base font-semibold text-[#6B5454]">{user.userName}</p>
							<p className="text-xs text-[#A88E88]">
								{user.role?.charAt(0) + user.role?.slice(1).toLowerCase()}
							</p>
						</div>
					</div>
				</div>

				<div className="mt-3 rounded-2xl border border-[#F0D9D3] bg-white p-4">
					<p className="text-sm font-semibold text-[#6B5454] mb-3">Personal Information</p>

					<label className="block text-xs font-semibold text-[#8D746E] mb-1">Name</label>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						pattern="[A-Za-z ]+"
						title="Name should contain only letters and spaces"
						disabled={!isEditing || isSaving}
						className="w-full rounded-xl border border-[#E8D1CC] bg-[#FFFDFC] px-3 py-2 text-sm text-[#6B5454] outline-none focus:border-[#FF8B77] disabled:bg-[#F9F2F0]"
					/>

					<label className="mt-3 block text-xs font-semibold text-[#8D746E] mb-1">Mobile Number</label>
					<input
						type="tel"
						value={mobile}
						onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
						pattern="[6-9][0-9]{9}"
						title="Enter 10 digits starting with 6, 7, 8, or 9"
						disabled={!isEditing || isSaving}
						className="w-full rounded-xl border border-[#E8D1CC] bg-[#FFFDFC] px-3 py-2 text-sm text-[#6B5454] outline-none focus:border-[#FF8B77] disabled:bg-[#F9F2F0]"
					/>

					{error && (
						<p className="mt-3 text-xs font-semibold text-[#A14B41]">{error}</p>
					)}
					{success && (
						<p className="mt-3 text-xs font-semibold text-[#3B8A66]">{success}</p>
					)}

					<div className="mt-4 flex flex-wrap justify-end gap-2">
						{!isEditing ? (
							<button
								type="button"
								onClick={() => {
									setError("");
									setSuccess("");
									setIsEditing(true);
								}}
								className="rounded-full border border-[#E7D3CF] px-4 py-2 text-sm font-semibold text-[#7A5F5A] hover:bg-[#FFF3F1] transition-colors"
							>
								Edit Profile
							</button>
						) : (
							<>
								<button
									type="button"
									onClick={handleCancel}
									disabled={isSaving}
									className="rounded-full border border-[#E7D3CF] px-4 py-2 text-sm font-semibold text-[#7A5F5A] hover:bg-[#FFF3F1] transition-colors disabled:opacity-60"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleSave}
									disabled={isSaving}
									className="rounded-full bg-[#FF8B77] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FF7A66] transition-colors disabled:opacity-60"
								>
									{isSaving ? "Saving..." : "Save Changes"}
								</button>
							</>
						)}
					</div>
				</div>

				<div className="mt-3 rounded-2xl border border-[#F0D9D3] bg-white p-4">
					<p className="text-sm font-semibold text-[#6B5454]">Account</p>
					<p className="mt-1 text-xs text-[#A88E88]">Email: {user.emailId || "Not available"}</p>
					<p className="mt-1 text-xs text-[#A88E88]">
						Role: {user.role?.charAt(0) + user.role?.slice(1).toLowerCase()}
					</p>
				</div>
			</div>

			<div className="mt-4 flex justify-end">
				<button
					type="button"
					onClick={onLogout}
					className="rounded-full bg-[#FF8B77] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FF7A66] transition-colors"
				>
					Logout
				</button>
			</div>
		</div>
	);
};

export default Profile;
