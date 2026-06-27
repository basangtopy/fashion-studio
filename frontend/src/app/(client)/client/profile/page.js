"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, Lock, Save, Camera, Shield, CheckCircle2, AlertTriangle, Calendar, Eye, EyeOff, LogOut } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toaster";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ClientProfilePage() {
    const { user, setUser, logout } = useAuth();
    const toast = useToast();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: user?.fullName || "",
        phone: user?.phone || "",
        address: user?.address || "",
        sex: user?.sex || "",
        dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
    });
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Invalid file", "Please select an image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large", "Image must be under 5MB.");
            return;
        }

        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append("profilePicture", file);

            const { data } = await api.put("/users/profile-picture", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            toast.success("Profile picture updated!");
            setUser((prev) => ({ ...prev, avatarUrl: data.data.profilePicture, profilePicture: data.data.profilePicture }));
        } catch (err) {
            toast.error("Upload failed", err.response?.data?.message || "Could not upload image.");
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const updateProfile = useMutation({
        mutationFn: async (data) => {
            const { data: res } = await api.put("/users/profile", data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success("Profile updated!");
            setUser((prev) => ({ ...prev, ...data.user || data }));
            setIsEditing(false);
        },
        onError: (err) => toast.error("Error", err.response?.data?.errors?.[0]?.message || err.response?.data?.message || "Failed to update."),
    });

    const changePassword = useMutation({
        mutationFn: async (data) => {
            const { data: res } = await api.put("/users/password", data);
            return res;
        },
        onSuccess: () => {
            toast.success("Password changed!");
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setShowPasswordForm(false);
        },
        onError: (err) => toast.error("Error", err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message || "Failed to change password."),
    });

    const resendVerification = useMutation({
        mutationFn: async () => {
            const { data } = await api.post("/auth/send-verification");
            return data;
        },
        onSuccess: () => toast.success("Verification email sent!", "Please check your inbox."),
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed to send verification."),
    });

    const handleSaveProfile = () => updateProfile.mutate(formData);

    const handleChangePassword = () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }
        if (passwordData.newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        changePassword.mutate({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword, confirmPassword: passwordData.confirmPassword });
    };

    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" })
        : "—";

    return (
        <div className="pb-[80px] lg:pb-[160px] max-w-5xl">
            <h1 className="text-2xl font-bold text-foreground mb-6">My Profile</h1>

            {/* ─── Email Verification Banner ─── */}
            {user && !user.isEmailVerified && (
                <div className="mb-6 p-4 rounded-xl bg-[#FFF3E0] border border-status-warning/20 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-status-warning shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-status-warning">Email not verified</p>
                        <p className="text-xs text-status-warning/80 mt-0.5">
                            Please verify your email address to access all features. Check your inbox for the verification link.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => resendVerification.mutate()}
                        disabled={resendVerification.isPending}
                        className="h-auto py-1.5 px-3 rounded-lg bg-status-warning/10 text-xs font-semibold text-status-warning hover:bg-status-warning/20 hover:text-status-warning shrink-0"
                    >
                        {resendVerification.isPending ? "Sending..." : "Resend"}
                    </Button>
                </div>
            )}

            <motion.div
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.08 } },
                }}
            >
                {/* ─── Left: Profile Card ─── */}
                <div className="space-y-4">
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } } }} className="p-6 rounded-xl border border-border bg-white text-center">
                        {/* Avatar with upload affordance */}
                        <div className="relative w-20 h-20 mx-auto mb-4">
                            <Avatar className="w-full h-full shadow-sm">
                                <AvatarImage src={user?.avatarUrl || user?.profilePicture} alt={user?.fullName || "User"} className="object-cover" />
                                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                                    {user?.fullName?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            {uploadingAvatar && (
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/jpeg, image/png, image/webp, image/gif"
                                onChange={handleAvatarChange}
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-border shadow-sm hover:bg-muted"
                            >
                                <Camera size={12} className="text-muted-foreground" />
                            </Button>
                        </div>
                        <p className="text-lg font-semibold text-foreground truncate px-2">{user?.fullName}</p>
                        <p className="text-xs text-text-light mb-2 truncate px-2">{user?.email}</p>
                        {user?.isEmailVerified && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[10px] font-semibold text-status-success">
                                <CheckCircle2 size={10} /> Verified
                            </div>
                        )}
                    </motion.div>

                    {/* Account Info */}
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } } }} className="p-6 rounded-xl border border-border bg-white space-y-3">
                        <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider">Account</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                            <Shield size={12} className="text-text-light shrink-0" />
                            <span className="truncate">Client Account</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                            <Mail size={12} className="text-text-light shrink-0" />
                            <span className="truncate">{user?.email}</span>
                        </div>
                        {user?.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                                <Phone size={12} className="text-text-light shrink-0" />
                                <span className="truncate">{user?.phone}</span>
                            </div>
                        )}
                        {user?.sex && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground capitalize overflow-hidden">
                                <User size={12} className="text-text-light shrink-0" />
                                <span className="truncate">{user?.sex.toLowerCase()}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                            <Calendar size={12} className="text-text-light shrink-0" />
                            <span className="truncate">Member since {memberSince}</span>
                        </div>
                    </motion.div>
                </div>

                {/* ─── Right: Edit Forms ─── */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Personal Info */}
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } } }} className="p-6 rounded-xl border border-border bg-white">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
                            {!isEditing ? (
                                <Button variant="link" onClick={() => setIsEditing(true)} className="h-auto p-0 text-xs font-semibold text-primary">
                                    Edit
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="link"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                fullName: user?.fullName || "",
                                                phone: user?.phone || "",
                                                address: user?.address || "",
                                                sex: user?.sex || "",
                                                dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
                                            });
                                        }}
                                        className="h-auto p-0 text-xs text-text-light hover:text-muted-foreground"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={updateProfile.isPending}
                                        className="h-8 px-3 gap-1 bg-status-success text-white text-xs font-semibold hover:bg-[#1B5E20]"
                                    >
                                        <Save size={12} /> {updateProfile.isPending ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label className="text-xs text-text-light mb-1.5 block">Full Name</Label>
                                <Input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    disabled={!isEditing}
                                    className="h-10 border-input focus-visible:ring-ring focus-visible:border-ring disabled:bg-surface-2 disabled:text-muted-foreground"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-text-light mb-1.5 block">Email</Label>
                                <Input
                                    type="email"
                                    value={user?.email || ""}
                                    disabled
                                    className="h-10 border-input bg-surface-2 text-text-light"
                                />
                                <p className="text-[10px] text-text-light mt-1">Email cannot be changed</p>
                            </div>
                            <div>
                                <Label className="text-xs text-text-light mb-1.5 block">Phone</Label>
                                <Input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={!isEditing}
                                    className="h-10 border-input focus-visible:ring-ring focus-visible:border-ring disabled:bg-surface-2 disabled:text-muted-foreground"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-text-light block">Biological Sex</Label>
                                    <Select value={formData.sex} onValueChange={(v) => setFormData({ ...formData, sex: v })} disabled={!isEditing}>
                                        <SelectTrigger className="w-full h-10 px-3 bg-background text-foreground border-input rounded-lg focus:ring-ring focus:border-ring transition-colors disabled:bg-surface-2 disabled:opacity-100 disabled:text-text-light">
                                            <SelectValue placeholder="Not Specified" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FEMALE">Female</SelectItem>
                                            <SelectItem value="MALE">Male</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-text-light block">Date of Birth</Label>
                                    <DobPicker value={formData.dateOfBirth} onChange={(v) => setFormData({ ...formData, dateOfBirth: v })} disabled={!isEditing} />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs text-text-light mb-1.5 block">Delivery Address</Label>
                                <Textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    disabled={!isEditing}
                                    rows={2}
                                    className="border-input focus-visible:ring-ring focus-visible:border-ring disabled:bg-surface-2 disabled:text-muted-foreground resize-none"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* ─── Security Section ─── */}
                    {user?.authProvider === 'LOCAL' && (
                        <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } } }} className="p-6 rounded-xl border border-border bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Lock size={14} className="text-text-light" />
                                    <h3 className="text-sm font-semibold text-foreground">Account Security</h3>
                                </div>
                                <Button
                                    variant="link"
                                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                                    className="h-auto p-0 text-xs font-semibold text-primary"
                                >
                                    {showPasswordForm ? "Cancel" : "Change Password"}
                                </Button>
                            </div>

                            <AnimatePresence>
                                {showPasswordForm && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                        <div className="space-y-4 pt-2">
                                            <div>
                                                <Label className="text-xs text-text-light mb-1.5 block">Current Password</Label>
                                                <div className="relative">
                                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light z-10" />
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        value={passwordData.currentPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                        className="pl-9 pr-10 h-10 border-input focus-visible:ring-ring focus-visible:border-ring"
                                                    />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light z-10 hover:text-muted-foreground">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-text-light mb-1.5 block">New Password</Label>
                                                <div className="relative">
                                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light z-10" />
                                                    <Input
                                                        type={showNewPassword ? "text" : "password"}
                                                        value={passwordData.newPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                        className="pl-9 pr-10 h-10 border-input focus-visible:ring-ring focus-visible:border-ring"
                                                    />
                                                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light z-10 hover:text-muted-foreground">{showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                                </div>
                                                <p className="text-[10px] text-text-light mt-1">Minimum 8 characters</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-text-light mb-1.5 block">Confirm New Password</Label>
                                                <div className="relative">
                                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light z-10" />
                                                    <Input
                                                        type={showNewPassword ? "text" : "password"}
                                                        value={passwordData.confirmPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                        className="pl-9 pr-10 h-10 border-input focus-visible:ring-ring focus-visible:border-ring"
                                                    />
                                                    
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handleChangePassword}
                                                disabled={changePassword.isPending}
                                                className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                                            >
                                                <Lock size={14} /> {changePassword.isPending ? "Saving..." : "Update Password"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Last login info */}
                            {!showPasswordForm && (
                                <div className="text-xs text-text-light">
                                    <p>Password last changed: —</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ─── Connected Accounts ─── */}
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } } }} className="p-6 rounded-xl border border-border bg-white">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield size={14} className="text-text-light" />
                            <h3 className="text-sm font-semibold text-foreground">Connected Accounts</h3>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-input bg-surface-2 gap-2 overflow-hidden">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-white border border-input shadow-sm flex items-center justify-center shrink-0">
                                    {user?.authProvider === 'GOOGLE' && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l2.48-1.92-1.2-2.84z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    )}
                                    {user?.authProvider === 'FACEBOOK' && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.96h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z" fill="#1877F2" />
                                        </svg>
                                    )}
                                    {user?.authProvider === 'TWITTER' && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    )}
                                    {user?.authProvider === 'LOCAL' && (
                                        <Mail size={14} className="text-muted-foreground" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {user?.authProvider === 'GOOGLE' && 'Google'}
                                        {user?.authProvider === 'FACEBOOK' && 'Facebook'}
                                        {user?.authProvider === 'TWITTER' && 'X (Twitter)'}
                                        {user?.authProvider === 'LOCAL' && 'Email Address'}
                                    </p>
                                    <p className="text-xs text-text-light truncate">{user?.email}</p>
                                </div>
                            </div>
                            <div className="px-2 py-1 rounded-md bg-status-success/10 text-status-success text-[10px] font-semibold shrink-0">
                                Connected
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}

// Custom Date of Birth Picker using highly premium Shadcn Selects (Day/Month/Year)
function DobPicker({ value, onChange, disabled }) {
    const [local, setLocal] = useState({ y: "", m: "", d: "" });

    useEffect(() => {
        if (value && value.includes("-")) {
            const [y, m, d] = value.split("-");
            setLocal({ y, m, d });
        }
    }, [value]);

    const handleChange = (key, val) => {
        const newLocal = { ...local, [key]: val };
        setLocal(newLocal);

        if (newLocal.y && newLocal.m && newLocal.d) {
            // Bound days in month
            const max = new Date(newLocal.y, newLocal.m, 0).getDate();
            const safeD = parseInt(newLocal.d) > max ? max.toString().padStart(2, '0') : newLocal.d;
            if (safeD !== newLocal.d) {
                newLocal.d = safeD;
                setLocal({ ...newLocal });
            }
            onChange(`${newLocal.y}-${newLocal.m}-${newLocal.d}`);
        }
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 80 }, (_, i) => (currentYear - 16 - i).toString());
    const months = [
        { v: "01", l: "Jan" }, { v: "02", l: "Feb" }, { v: "03", l: "Mar" }, { v: "04", l: "Apr" },
        { v: "05", l: "May" }, { v: "06", l: "Jun" }, { v: "07", l: "Jul" }, { v: "08", l: "Aug" },
        { v: "09", l: "Sep" }, { v: "10", l: "Oct" }, { v: "11", l: "Nov" }, { v: "12", l: "Dec" }
    ];
    const maxDays = new Date(local.y || 2000, local.m || 1, 0).getDate();
    const days = Array.from({ length: maxDays }, (_, i) => (i + 1).toString().padStart(2, '0'));

    return (
        <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-2">
            <Select value={local.d} onValueChange={(v) => handleChange("d", v)} disabled={disabled}>
                <SelectTrigger className="h-10 px-2 bg-background text-foreground border-input rounded-lg focus:ring-ring focus:border-ring disabled:bg-surface-2 disabled:opacity-100 disabled:text-text-light">
                    <SelectValue placeholder="DD" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[200px]">
                    {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
            </Select>

            <Select value={local.m} onValueChange={(v) => handleChange("m", v)} disabled={disabled}>
                <SelectTrigger className="h-10 px-2 bg-background text-foreground border-input rounded-lg focus:ring-ring focus:border-ring disabled:bg-surface-2 disabled:opacity-100 disabled:text-text-light">
                    <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[200px]">
                    {months.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}
                </SelectContent>
            </Select>

            <Select value={local.y} onValueChange={(v) => handleChange("y", v)} disabled={disabled}>
                <SelectTrigger className="h-10 px-2 bg-background text-foreground border-input rounded-lg focus:ring-ring focus:border-ring disabled:bg-surface-2 disabled:opacity-100 disabled:text-text-light">
                    <SelectValue placeholder="YYYY" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[200px]">
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    );
}
