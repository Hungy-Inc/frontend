"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaChevronDown } from 'react-icons/fa';
import { useOrganization } from '@/hooks/queries/useOrganization';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
    const router = useRouter();
    const [user, setUser] = useState<{ email?: string; organizationId?: number } | null>(null);

    useEffect(() => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                setUser(JSON.parse(userStr));
            }
        } catch (err) {
            console.error('Error parsing user data:', err);
        }
    }, []);

    const { data: org, isLoading } = useOrganization(user?.organizationId);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('donorPageAuthenticated');
        router.push('/');
    };

    const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U';

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-8">
                <div className="text-xl font-extrabold uppercase tracking-wider text-muted-foreground/80">
                    {isLoading ?
                        <span className="animate-pulse bg-muted h-6 w-32 rounded inline-block" /> :
                        (org?.name || 'Organization')}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-auto gap-2 px-2 hover:bg-muted/50">
                            <span className="text-sm font-medium hidden sm:inline-block">
                                {user?.email}
                            </span>
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <FaChevronDown className="h-3 w-3 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <div className="flex items-center justify-start gap-2 p-2">
                            <div className="flex flex-col space-y-1 leading-none">
                                <p className="font-medium">{user?.email}</p>
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
