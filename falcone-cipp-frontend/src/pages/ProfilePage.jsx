import React, { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../api/axios";
import "./ProfilePage.css";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    idNumber: "",
    profilePicture: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await getProfile();
        setProfile(res.data);
        setPreview(res.data.profilePicture || "/default-profile.png");
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    }
    fetchProfile();
  }, []);

  // Update preview when a new file is selected
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("surname", profile.surname);
      formData.append("email", profile.email);
      formData.append("phone", profile.phone);
      formData.append("idNumber", profile.idNumber);
      if (selectedFile) formData.append("profilePicture", selectedFile);

      const res = await updateProfile(formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfile(res.data.user);
      setPreview(res.data.user.profilePicture || "/default-profile.png");
      setMessage("Profile updated successfully!");
      setSelectedFile(null);
    } catch (err) {
      console.error("Update failed:", err);
      setMessage("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <h2>My Profile</h2>
      {message && <p className={message.includes("success") ? "success-alert" : "error-alert"}>{message}</p>}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-picture-wrapper">
          <img src={preview} alt="Profile" />
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <div className="form-group">
          <label>Name</label>
          <div className="input-wrapper">
            <input type="text" name="name" value={profile.name} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label>Surname</label>
          <div className="input-wrapper">
            <input type="text" name="surname" value={profile.surname} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label>Email</label>
          <div className="input-wrapper">
            <input type="email" name="email" value={profile.email} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label>Phone</label>
          <div className="input-wrapper">
            <input type="text" name="phone" value={profile.phone} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label>ID Number</label>
          <div className="input-wrapper">
            <input type="text" name="idNumber" value={profile.idNumber} onChange={handleChange} />
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}
// (Code Bless You , 2025). 