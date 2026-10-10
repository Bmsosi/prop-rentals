import React, { useState } from "react";
import { Linkedin, Globe } from "lucide-react";

const TeamSection = ({ sectionRef }) => {
    const [activeMember, setActiveMember] = useState(null);
    const teamMembers = [
        // First Row - 5 Peopl
        { name: "Aboubakar Muco", role: "PM (Full Stack Dev)", image: "/images/dev-team/dev-2.jpeg", linkedin: "https://www.linkedin.com/in/aboubakar-muco-47b31975/", portfolio: "#" },
        { name: "Nil Yilmaz", role: "Lead Designer", image: "/images/dev-team/dev-6.jpeg", linkedin: "https://www.linkedin.com/in/nil-yılmaz-8b4476111/?utm_source=share_via&utm_content=profile&utm_medium=member_ios", portfolio: "#" },
        { name: "Ana Paola", role: "Designer", image: "/images/dev-team/dev-8.jpeg", linkedin: "https://www.linkedin.com/in/ana-morais-80a613128?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", portfolio: "https://anapaolasdm.myportfolio.com/work" },
        { name: "Tejinder Kaur", role: "Designer", image: "/images/dev-team/dev-5.jpeg", linkedin: "https://www.linkedin.com/in/tejinder-kaur-b853442a5?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", portfolio: "#" },
        { name: "Yang Yi Hsiang", role: "Designer", image: "/images/dev-team/dev-7.jpeg", linkedin: "https://www.linkedin.com/in/yi-hsiang-yang-186817178", portfolio: "#" },
        // Second Row - 4 People
        { name: "Oluwademilade", role: "Full Stack Dev (Lead)", image: "/images/dev-team/dev-1.jpeg", linkedin: "https://www.linkedin.com/in/oluwademiladealuko?utm_source=share_via&utm_content=profile&utm_medium=member_ios", portfolio: "#" },
        { name: "Shubham Sharma", role: "Full Stack Dev", image: "/images/dev-team/dev-4.jpeg", linkedin: "https://www.linkedin.com/in/shubham-sharma-1a179727b/", portfolio: "#" },
        { name: "Gurdit Singh", role: "Full Stack Dev", image: "/images/dev-team/dev-3.jpeg", linkedin: "https://www.linkedin.com/in/gurdit-singh-971114193?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", portfolio: "#" },
        { name: "Zin Min Htun", role: "Full Stack Dev", image: "/images/dev-team/dev-9.jpeg", linkedin: "#", portfolio: "https://zin-min-portfolio.vercel.app/" },
    ];

    return (
        <section className="py-8 sm:py-16 lg:py-20 relative overflow-hidden">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-6 sm:mb-12 md:mb-16" ref={sectionRef}>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4 sm:mb-6 md:mb-8 leading-relaxed">
                        Meet Our Team
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                        Get to know the dedicated professionals who drive our success and innovation.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto mt-12 text-center sm:px-0 md:mt-20">
                    {/* Mobile: All in one 2-column grid, Desktop: Split into two rows */}
                    {/* Mobile Grid - All 9 people in 2 columns */}
                    <div className="grid grid-cols-2 md:hidden gap-x-4 gap-y-12 sm:px-0">
                        {teamMembers.map((member, index) => {
                            const isLastItem = index === teamMembers.length - 1;
                            const isMobileLastInRow = isLastItem && (teamMembers.length % 2 === 1);
                            const isActive = activeMember === index;
                            return (
                                <div 
                                    key={index} 
                                    className={`group ${isMobileLastInRow ? 'col-span-2' : ''}`}
                                    onClick={() => setActiveMember(isActive ? null : index)}
                                >
                                    <div className="relative inline-block mx-auto">
                                        <img
                                            className={`object-cover w-24 h-24 rounded-full filter border-4 transition-all duration-300 ${isActive ? 'grayscale-0 scale-105 border-[#1D3742]' : 'grayscale-50 border-transparent'}`}
                                            src={member.image}
                                            alt={member.name}
                                        />
                                        <span className={`absolute bottom-0 right-2 w-5 h-5 bg-green-500 rounded-full border-3 border-white/90 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}></span>
                                    </div>
                                    {/* Name and Role - Hidden on active */}
                                    <div className={`mt-2 transition-opacity duration-300 ${isActive ? 'hidden' : 'block'}`}>
                                        <p className="text-base font-bold text-primary leading-relaxed">{member.name}</p>
                                        <p className="text-sm font-normal text-gray-600 leading-relaxed mt-1">{member.role}</p>
                                    </div>
                                    {/* Buttons - Shown on active */}
                                    <div className={`${isActive ? 'flex' : 'hidden'} items-center justify-center gap-2 mt-4`}>
                                        {member.portfolio && (
                                            <a
                                                href={member.portfolio}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300"
                                                aria-label={`View ${member.name}'s portfolio`}
                                                title="View Portfolio"
                                            >
                                                <Globe className="w-4 h-4" />
                                            </a>
                                        )}
                                        {member.linkedin && (
                                            <a
                                                href={member.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300"
                                                aria-label={`Connect with ${member.name} on LinkedIn`}
                                                title="LinkedIn"
                                            >
                                                <Linkedin className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop: First Row - 5 People */}
                    <div className="hidden md:grid md:grid-cols-5 gap-x-8 lg:gap-x-16 xl:gap-x-20 mb-0">
                        {teamMembers.slice(0, 5).map((member, index) => (
                            <div key={index} className="group">
                                <div className="relative inline-block mx-auto">
                                    <img
                                        className="object-cover w-24 h-24 rounded-full lg:w-32 lg:h-32 grayscale-50 filter border-4 border-transparent transition-all duration-300 group-hover:grayscale-0 group-hover:scale-105 group-hover:border-[#1D3742]"
                                        src={member.image}
                                        alt={member.name}
                                    />
                                    <span className="absolute bottom-0 right-2 w-5 h-5 bg-green-500 rounded-full border-3 border-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                </div>
                                {/* Name and Role - Hidden on hover */}
                                <div className="mt-2 group-hover:hidden transition-opacity duration-300">
                                    <p className="text-base font-bold text-primary sm:text-lg sm:mt-3 leading-relaxed">{member.name}</p>
                                    <p className="text-sm font-normal text-gray-600 leading-relaxed mt-1">{member.role}</p>
                                </div>
                                {/* Buttons - Shown on hover */}
                                <div className="hidden group-hover:flex items-center justify-center gap-2 mt-4">
                                    {member.portfolio && (
                                        <a
                                            href={member.portfolio}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300"
                                            aria-label={`View ${member.name}'s portfolio`}
                                            title="View Portfolio"
                                        >
                                            <Globe className="w-4 h-4" />
                                        </a>
                                    )}
                                    {member.linkedin && (
                                        <a
                                            href={member.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300"
                                            aria-label={`Connect with ${member.name} on LinkedIn`}
                                            title="LinkedIn"
                                        >
                                            <Linkedin className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: Second Row - 4 People (Centered) */}
                    <div className="hidden md:flex md:justify-center">
                        <div className="grid md:grid-cols-4 gap-x-8 lg:gap-x-16 xl:gap-x-20">
                            {teamMembers.slice(5).map((member, index) => (
                                <div 
                                    key={index + 5} 
                                    className="group"
                                >
                                    <div className="relative inline-block mx-auto">
                                        <img
                                            className="object-cover w-24 h-24 rounded-full lg:w-32 lg:h-32 grayscale-50 filter border-4 border-transparent transition-all duration-300 group-hover:grayscale-0 group-hover:scale-105 group-hover:border-[#1D3742]"
                                            src={member.image}
                                            alt={member.name}
                                        />
                                        <span className="absolute bottom-0 right-2 w-5 h-5 bg-green-500 rounded-full border-3 border-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                    </div>
                                    {/* Name and Role - Hidden on hover */}
                                    <div className="mt-2 group-hover:hidden transition-opacity duration-300">
                                        <p className="text-base font-bold text-primary sm:text-lg sm:mt-3 leading-relaxed">{member.name}</p>
                                        <p className="text-sm font-normal text-gray-600 leading-relaxed mt-1">{member.role}</p>
                                    </div>
                                    {/* Buttons - Shown on hover */}
                                    <div className="hidden group-hover:flex items-center justify-center gap-2 mt-4">
                                        {member.portfolio && (
                                            <a
                                                href={member.portfolio}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300"
                                                aria-label={`View ${member.name}'s portfolio`}
                                                title="View Portfolio"
                                            >
                                                <Globe className="w-4 h-4" />
                                            </a>
                                        )}
                                        {member.linkedin && (
                                            <a
                                                href={member.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300"
                                                aria-label={`Connect with ${member.name} on LinkedIn`}
                                                title="LinkedIn"
                                            >
                                                <Linkedin className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TeamSection;

