"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Shield, ShieldCheck, ShieldAlert, UserCog, Loader2, Eye, EyeOff, Lock, ArrowUpDown, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useDebounce from "@/hooks/useDebounce";

// ─── Search Fetcher ────────────────────────────────────────────────────────

async function searchUsers(query) {
    const encoded = encodeURIComponent(query);

    const [clientsRes, staffRes] = await Promise.all([
        api.get(`/users/admin/clients?search=${encoded}&limit=10`),
        api.get(`/users/admin/staff?search=${encoded}&limit=10`).catch(() => ({ data: { data: { staff: [] } } })),
    ]);

    const clients = (clientsRes.data?.data?.clients || []).map((u) => ({ ...u, role: "CLIENT" }));
    const staff = (staffRes.data?.data?.staff || []).map((u) => ({ ...u, role: "STAFF_ADMIN" }));

    return [...staff, ...clients];
}

// ─── Main Section ──────────────────────────────────────────────────────────

export default function RoleManagementSection() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [targetRole, setTargetRole] = useState(null);

    const debouncedQuery = useDebounce(searchQuery.trim());

    const { data: searchResults = [], isFetching } = useQuery({
        queryKey: ["role-search", debouncedQuery],
        queryFn: () => searchUsers(debouncedQuery),
        enabled: debouncedQuery.length > 0,
        staleTime: 30_000,
    });

    const hasSearched = debouncedQuery.length > 0;

    const handleRoleChangeClick = (user) => {
        setSelectedUser(user);
        setTargetRole(user.role === "CLIENT" ? "STAFF_ADMIN" : "CLIENT");
    };

    const handleRoleChanged = (updatedUser) => {
        // Optimistic update — patch the cached search results in place
        queryClient.setQueryData(["role-search", debouncedQuery], (prev) =>
            prev?.map((u) =>
                u.id === updatedUser.id ? { ...u, role: updatedUser.role } : u
            )
        );
    };

    return (
        <section className="p-6 rounded-xl border border-border bg-white mb-4">
            <div className="flex items-center gap-2 mb-1">
                <UserCog size={16} className="text-primary" />
                <h2 className="text-sm font-bold text-foreground">Role Management</h2>
            </div>
            <p className="text-[10px] text-text-light mb-4">
                Promote clients to Staff Admin or demote staff back to Client. Password required for all changes.
            </p>

            {/* Search bar */}
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-surface-2 h-9 text-sm"
                />
                {isFetching && (
                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light animate-spin" />
                )}
            </div>

            {/* Results */}
            {hasSearched && (
                <div className="mt-3">
                    {searchResults.length === 0 && !isFetching ? (
                        <div className="text-center py-6">
                            <Search size={20} className="text-[#DDD] mx-auto mb-2" />
                            <p className="text-xs text-text-light">No users found matching &quot;{debouncedQuery}&quot;</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                            {searchResults.map((user) => (
                                <UserRoleRow
                                    key={user.id}
                                    user={user}
                                    onChangeRole={() => handleRoleChangeClick(user)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation modal */}
            {selectedUser && targetRole && (
                <PasswordConfirmModal
                    open={!!selectedUser}
                    onClose={() => {
                        setSelectedUser(null);
                        setTargetRole(null);
                    }}
                    user={selectedUser}
                    targetRole={targetRole}
                    onSuccess={handleRoleChanged}
                />
            )}
        </section>
    );
}

// ─── User Row ──────────────────────────────────────────────────────────────

function UserRoleRow({ user, onChangeRole }) {
    const isStaff = user.role === "STAFF_ADMIN";

    return (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-[rgba(0,0,0,0.04)] bg-surface-2 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div className="relative shrink-0">
                    {user.profilePicture ? (
                        <Image
                            src={user.profilePicture}
                            alt={user.fullName}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-primary">
                            {user.fullName?.charAt(0)?.toUpperCase()}
                        </div>
                    )}
                    {/* Role indicator dot */}
                    <div
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center"
                        style={{ backgroundColor: isStaff ? "#C2185B" : "#E0E0E0" }}
                    >
                        {isStaff ? (
                            <ShieldCheck size={7} className="text-white" />
                        ) : null}
                    </div>
                </div>

                {/* Info */}
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{user.fullName}</p>
                    <p className="text-[10px] text-text-light truncate">{user.email}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {/* Current role badge */}
                <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                    style={{
                        backgroundColor: isStaff ? "rgba(194, 24, 91, 0.1)" : "rgba(0, 0, 0, 0.05)",
                        color: isStaff ? "#C2185B" : "#999",
                    }}
                >
                    {isStaff ? "Staff" : "Client"}
                </span>

                {/* Change role button */}
                <button
                    onClick={onChangeRole}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-[rgba(0,0,0,0.08)] bg-white hover:bg-muted hover:border-primary/20 text-muted-foreground hover:text-primary transition-all duration-200"
                    title={isStaff ? "Demote to Client" : "Promote to Staff Admin"}
                >
                    <ArrowUpDown size={10} />
                    {isStaff ? "Demote" : "Promote"}
                </button>
            </div>
        </div>
    );
}

// ─── Password Confirmation Modal ───────────────────────────────────────────

function PasswordConfirmModal({ open, onClose, user, targetRole, onSuccess }) {
    const toast = useToast();
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef(null);

    const isPromoting = targetRole === "STAFF_ADMIN";

    const mutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.patch(`/users/admin/users/${user.id}/role`, {
                newRole: targetRole,
                confirmPassword: password,
            });
            return data.data?.user || data.data;
        },
        onSuccess: (updatedUser) => {
            toast.success(
                "Role Updated",
                `${user.fullName} is now a ${isPromoting ? "Staff Admin" : "Client"}.`
            );
            if (onSuccess) onSuccess(updatedUser);
            onClose();
        },
        onError: (err) => {
            const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || "Role change failed.";
            toast.error("Error", msg);
        },
    });

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setPassword("");
            setShowPassword(false);
            // Auto-focus the password input
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!password.trim()) return;
        mutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-sm p-0 overflow-hidden border-0 gap-0">
                {/* Header with security indicator */}
                <DialogHeader className="px-6 pt-5 pb-4 text-left shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: isPromoting ? "rgba(194, 24, 91, 0.1)" : "rgba(198, 40, 40, 0.1)" }}
                        >
                            {isPromoting ? (
                                <ShieldCheck size={18} className="text-primary" />
                            ) : (
                                <ShieldAlert size={18} className="text-destructive" />
                            )}
                        </div>
                    </div>
                    <DialogTitle className="text-sm font-bold text-foreground">
                        {isPromoting ? "Promote to Staff Admin" : "Demote to Client"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-text-light mt-1">
                        {isPromoting
                            ? `This will give ${user.fullName} access to the admin dashboard, orders, clients, and messaging.`
                            : `This will remove ${user.fullName}'s admin access. They will only be able to use client features.`
                        }
                    </DialogDescription>
                </DialogHeader>

                {/* User card */}
                <div className="mx-6 mb-4 px-3 py-2.5 rounded-lg bg-surface-2 border border-[rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-3">
                        {user.profilePicture ? (
                            <Image src={user.profilePicture} alt={user.fullName} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-primary">
                                {user.fullName?.charAt(0)?.toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{user.fullName}</p>
                            <p className="text-[10px] text-text-light truncate">{user.email}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-text-light">
                            <span className="px-1.5 py-0.5 rounded bg-[rgba(0,0,0,0.05)] font-medium">
                                {user.role === "STAFF_ADMIN" ? "Staff" : "Client"}
                            </span>
                            <span>→</span>
                            <span
                                className="px-1.5 py-0.5 rounded font-medium"
                                style={{
                                    backgroundColor: isPromoting ? "rgba(194, 24, 91, 0.1)" : "rgba(0,0,0,0.05)",
                                    color: isPromoting ? "#C2185B" : "#555",
                                }}
                            >
                                {isPromoting ? "Staff" : "Client"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Password form */}
                <form onSubmit={handleSubmit} className="px-6 pb-6">
                    <div className="mb-4">
                        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-text-light uppercase tracking-wider mb-1.5">
                            <Lock size={10} />
                            Enter your password to confirm
                        </label>
                        <div className="relative">
                            <Input
                                ref={inputRef}
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Your super admin password"
                                className="bg-surface-2 h-10 pr-10"
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-muted-foreground transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={mutation.isPending}
                            className="flex-1 h-9 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending || !password.trim()}
                            className="flex-1 h-9 text-xs text-white"
                            style={{
                                backgroundColor: isPromoting ? "#C2185B" : "#C62828",
                            }}
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 size={12} className="animate-spin mr-1.5" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <Shield size={12} className="mr-1.5" />
                                    {isPromoting ? "Promote" : "Demote"}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
