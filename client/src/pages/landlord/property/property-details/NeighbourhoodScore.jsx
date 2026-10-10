import React, { useState, useMemo } from 'react';
import { ChevronRight, School, ShoppingBag, Coffee, Trees, Train, Heart } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const NeighbourhoodScore = () => {
    const [showDialog, setShowDialog] = useState(false);

    // Generate random scores when dialog opens
    const scores = useMemo(() => ({
        walkability: Math.floor(Math.random() * 30) + 70, // 70-100
        transit: Math.floor(Math.random() * 30) + 65, // 65-95
        schools: Math.floor(Math.random() * 30) + 70, // 70-100
        shopping: Math.floor(Math.random() * 30) + 60, // 60-90
        dining: Math.floor(Math.random() * 30) + 65, // 65-95
        parks: Math.floor(Math.random() * 30) + 70, // 70-100
    }), [showDialog]);

    const categories = [
        { name: 'Walkability', score: scores.walkability, icon: Trees },
        { name: 'Transit Score', score: scores.transit, icon: Train },
        { name: 'School Rating', score: scores.schools, icon: School },
        { name: 'Shopping', score: scores.shopping, icon: ShoppingBag },
        { name: 'Dining & Nightlife', score: scores.dining, icon: Coffee },
        { name: 'Parks & Recreation', score: scores.parks, icon: Heart },
    ];

    return (
        <>
            <div className="bg-card rounded-2xl p-6">
                <button
                    onClick={() => setShowDialog(true)}
                    className="flex items-center justify-between w-full hover:opacity-80 transition-opacity"
                >
                    <h2 className="text-lg sm:text-xl md:text-[24px] font-bold text-primary">Neighbourhood Score</h2>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>

            {/* Neighbourhood Score Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-[20px] font-bold text-primary">Neighbourhood Score</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 space-y-3 text-primary">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            return (
                                <div key={category.name} className="flex items-center gap-3 p-3 rounded-2xl bg-card">
                                    <div className="p-2 rounded-full bg-gray-100">
                                        <Icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="font-semibold text-sm text-primary">{category.name}</h3>
                                            <span className="text-lg font-bold text-primary">
                                                {category.score}
                                            </span>
                                        </div>
                                        <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                            <div 
                                                className="h-1.5 rounded-full bg-primary transition-all"
                                                style={{ width: `${category.score}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <p className="text-xs text-primary text-center mt-4">
                            * Demo scores for illustration
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default NeighbourhoodScore;