import React from 'react';
import { Phone, Mail } from 'lucide-react';

const ContactInfo = ({ ownerName, ownerPhone, ownerEmail }) => {
    return (
        <div className="bg-card rounded-2xl p-6">
            <h2 className="text-lg sm:text-xl md:text-[24px] font-bold mb-4 text-primary">Contact Info</h2>
            <div className="space-y-1">
                <div className="text-sm sm:text-base md:text-[16px]">
                    <p>{ownerName}</p>
                    <p className="text-gray-600">Owner</p>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className='text-sm sm:text-base md:text-[16px]'>{ownerPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-sm sm:text-base md:text-[16px] break-all">{ownerEmail}</span>
                </div>
            </div>
        </div>
    );
};

export default ContactInfo;