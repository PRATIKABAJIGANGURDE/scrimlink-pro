import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface ResponsiveNavbarProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    variant?: "floating" | "default";
}

export const ResponsiveNavbar = ({ title, subtitle, icon, children, variant = "floating" }: ResponsiveNavbarProps) => {
    const [open, setOpen] = useState(false);

    const headerClass = variant === "floating"
        ? "fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 rounded-xl border border-border/40 bg-background/70 backdrop-blur-md shadow-sm"
        : "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60";

    return (
        <header className={headerClass}>
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {icon}
                    <div>
                        <h1 className="text-xl font-bold">{title}</h1>
                        {subtitle && <p className="text-sm text-muted-foreground hidden sm:block">{subtitle}</p>}
                    </div>
                </div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6">
                    {children}
                </div>

                {/* Mobile Nav */}
                <div className="md:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <SheetHeader className="text-left">
                                <SheetTitle>{title}</SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col gap-4 mt-8">
                                <div className="flex flex-col gap-3" onClick={() => setOpen(false)}>
                                    {children}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
};
