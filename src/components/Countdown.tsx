import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface CountdownProps {
    targetDate: string;
    className?: string;
}

export const Countdown = ({ targetDate, className }: CountdownProps) => {
    const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate).getTime() - new Date().getTime();

            if (difference > 0) {
                const hours = Math.floor((difference / (1000 * 60 * 60)));
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);

                setTimeLeft({
                    hours: hours.toString().padStart(2, '0'),
                    minutes: minutes.toString().padStart(2, '0'),
                    seconds: seconds.toString().padStart(2, '0')
                });
            } else {
                setTimeLeft(null);
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft(); // Initial call

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) {
        return <Badge variant="secondary" className={className}>Started</Badge>;
    }

    return (
        <div className={`flex items-center gap-1 font-mono text-xs md:text-sm bg-muted/50 px-2 py-1 rounded border ${className}`}>
            <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1 text-primary animate-pulse" />
            <span className="font-bold">{timeLeft.hours}</span>:
            <span className="font-bold">{timeLeft.minutes}</span>:
            <span className="font-bold">{timeLeft.seconds}</span>
        </div>
    );
};
