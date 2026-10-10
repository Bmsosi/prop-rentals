import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const LandingHeader = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header
            className="relative top-0 left-0 right-0 z-50 shadow-lg backdrop-blur-sm"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex justify-between items-center h-24">
                    {/* Logo */}
                    <div className="flex items-center">
                        <svg width="146" height="32" viewBox="0 0 146 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
                            <path d="M8.93487 25.3281V15.7329C8.93487 15.5683 9.31172 15.0193 9.43797 14.8587L18.0193 5.99608C18.4574 5.6288 19.0944 5.58098 19.6071 5.78948C22.0824 7.35234 24.6247 8.83677 27.0656 10.4494C28.3606 11.3044 29.4548 11.687 29.5906 13.4316C29.8948 17.29 29.3668 21.552 29.5753 25.4524C29.4969 26.6843 28.4333 27.57 27.2282 27.0899C24.5003 25.1827 21.5238 23.5701 18.8189 21.6381C18.3484 21.3014 17.7745 20.8576 17.6061 20.2799C17.3766 19.4956 17.3823 16.1365 17.6061 15.3158C17.916 14.1777 19.7505 13.9691 20.5023 14.8127C21.2541 15.6563 20.6974 17.9155 20.8868 18.9733L26.1914 22.3898V13.8505L19.4617 9.60577L19.1881 9.54838L12.2787 16.785L12.2289 28.7637C12.0223 29.9229 10.7789 30.5944 9.73065 29.9937L0.996241 23.9469C-0.264375 23.0402 0.116296 21.7069 0.125861 20.4176C0.148816 17.2135 -0.162991 13.3207 0.118209 10.2179C0.200465 9.30161 0.7533 8.76217 1.3597 8.15386C3.34722 6.15868 5.54517 4.21706 7.6073 2.2831C8.85262 1.11621 9.8722 -0.745061 11.7736 0.314698C12.8659 0.923008 15.2513 2.3424 16.1389 3.10948C17.4378 4.23045 16.5081 6.38632 14.8611 6.1319C14.6488 6.09938 14.423 5.94443 14.2318 5.84496C13.1624 5.29212 12.0893 4.41409 11.041 3.79431L10.8612 3.78474L4.75513 9.53307L3.44478 10.8855V21.4984L3.70877 21.7853L8.93296 25.3281H8.93487Z" fill="#FEFFF8" />
                            <path d="M36.1057 19.0841V25.3738C36.1057 26.0376 34.9445 26.7128 34.3152 26.7128C33.6858 26.7128 32.5247 26.0376 32.5247 25.3738V15.4113H40.8325C41.3471 15.4113 42.5599 14.6882 42.9463 14.3114C46.0261 11.3176 42.8296 6.09919 38.6767 7.65248C37.3893 8.13454 36.1057 9.74522 36.1057 11.1397V13.6648H32.5247V10.497C32.5247 8.18427 34.8833 5.43158 36.8976 4.49616C43.8932 1.24419 50.7931 9.28038 46.4603 15.7135C43.9754 19.4036 40.119 19.1836 36.1038 19.0822L36.1057 19.0841Z" fill="#FEFFF8" />
                            <path d="M101.191 5.12769V8.61686H93.1126V14.0343H97.2885C97.5888 14.0343 98.1761 14.3556 98.3942 14.5814C99.2282 15.4479 99.0121 16.9821 97.9179 17.5081C97.8299 17.5502 97.432 17.7071 97.3822 17.7071H93.1145V23.1245H99.5859C99.8614 23.1245 100.437 23.4248 100.646 23.6256C101.277 24.2378 101.375 25.1694 100.904 25.9097C100.747 26.1584 100.145 26.7055 99.8633 26.7055H89.5354V5.12769H101.195H101.191Z" fill="#FEFFF8" />
                            <path d="M76.4055 26.7053V31.8472H72.8245V23.2161C73.1765 23.2658 73.5285 23.1702 73.8651 23.1587C76.0554 23.0764 78.9057 23.4724 81.0328 23.1166C86.1671 22.2615 84.6215 14.1335 79.4298 15.3616C78.1558 15.6639 76.4055 17.2057 76.4055 18.5792V21.4715H72.9622C72.9527 21.4715 72.8245 21.3433 72.8245 21.3338V18.5792C72.8245 15.9642 75.2482 13.1407 77.5992 12.2455C84.5278 9.60946 90.6816 17.4677 86.4311 23.5585C85.4402 24.9779 83.0012 26.7053 81.2241 26.7053H76.4055Z" fill="#FEFFF8" />
                            <path d="M141.949 17.4312C141.018 15.3232 138.062 14.6307 136.228 15.9774C134.039 17.5842 133.963 20.708 136.123 22.3876C138.068 23.8988 140.995 22.445 142.41 23.5353C143.623 24.4688 143.126 26.5272 141.536 26.7051C138.087 27.0934 135.009 26.4889 132.721 23.7668C128.05 18.2117 133.494 10.1946 140.446 12.0004C143.944 12.9091 146.628 16.7617 145.869 20.3848C145.829 20.5722 145.833 20.9376 145.655 20.9969L137.888 20.9854C136.503 20.84 135.74 19.2523 136.626 18.1179C136.817 17.8731 137.481 17.4293 137.773 17.4293H141.949V17.4312Z" fill="#FEFFF8" />
                            <path d="M112.023 22.5732V26.4296C107.593 27.7476 102.729 24.6238 102.38 19.9601C101.761 11.6466 112.538 8.55912 116.444 15.9927C117.569 18.1333 117.559 22.4029 117.351 24.8266C117.129 27.4033 114.001 27.1833 113.768 25.0982C113.422 22.0127 115.055 16.8153 111.155 15.4992C106.916 14.0702 103.941 19.5967 107.431 22.3456C108.779 23.4091 110.551 23.3422 112.023 22.5732Z" fill="#FEFFF8" />
                            <path d="M62.984 11.7652C67.8008 11.3463 71.837 15.5815 71.0547 20.3887C70.0293 26.6841 62.106 28.9605 57.9569 24.0864C54.0392 19.4839 56.9775 12.2894 62.984 11.7672V11.7652ZM63.3532 15.2525C57.8765 15.6332 59.0549 24.2949 64.4952 23.0993C69.2221 22.0606 68.2293 14.9139 63.3532 15.2525Z" fill="#FEFFF8" />
                            <path d="M129.649 11.7385V15.2277L123.646 15.2373C122.105 15.4324 122.215 17.2841 123.449 17.4333C124.566 17.5691 125.458 17.3109 126.644 17.726C130.835 19.1989 130.548 25.4197 126.323 26.5465C125.23 26.8372 121.818 26.8162 120.601 26.7091C118.522 26.5254 118.52 23.5623 120.259 23.2371C121.659 22.975 123.518 23.4035 124.987 23.1931C126.456 22.9827 126.449 21.3242 125.427 21.0564C124.7 20.8651 123.528 21.0679 122.648 20.8976C118.839 20.1592 117.676 15.1856 120.699 12.7505C121.205 12.343 122.445 11.7385 123.084 11.7385H129.647H129.649Z" fill="#FEFFF8" />
                            <path d="M55.3841 11.7385V15.1818C55.3841 15.3635 54.6706 15.3138 54.4621 15.3616C49.9935 16.3678 51.8605 22.0205 51.4301 25.1825C51.1546 27.2083 48.0557 27.2504 47.8548 25.0104C47.7114 23.4112 47.7496 20.6585 47.8548 19.0344C48.0978 15.2602 51.5468 11.7385 55.386 11.7385H55.3841Z" fill="#FEFFF8" />
                        </svg>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-12">
                        <a href="#features" className="text-xl text-background/80 hover:text-background transition-colors">
                            Features
                        </a>
                        <a href="#pricing" className="text-xl text-background/80 hover:text-background transition-colors">
                            Pricing
                        </a>
                        <a href="#contact" className="text-xl text-background/80 hover:text-background transition-colors">
                            Contact Us
                        </a>
                        <a 
                            href="/documentation" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xl text-background/80 hover:text-background transition-colors"
                        >
                            Documentation
                        </a>
                        <a 
                            href="https://www.figma.com/design/CXkcqLPtSwft5qe09M41PB/Racoon-Tenancy-App-Wireframes?node-id=86-1687&p=f&t=dOqBec3rr28PU3Fj-0" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xl text-background/80 hover:text-background transition-colors"
                        >
                            Design Files
                        </a>
                    </nav>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden text-background"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Navigation Dropdown */}
                {mobileMenuOpen && createPortal(
                    <>
                        {/* Overlay backdrop */}
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] md:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        ></div>
                        {/* Close button outside the box with blur effect */}
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed top-28 right-6 p-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors z-[10000] md:hidden"
                            aria-label="Close menu"
                        >
                            <X className="w-6 h-6 text-gray-800" />
                        </button>
                        {/* Mobile menu dropdown */}
                        <div 
                            className="fixed top-24 left-4 right-4 bg-white/10 backdrop-blur-md shadow-2xl rounded-xl border border-white/20 z-[9999] md:hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <nav className="flex flex-col p-4 space-y-3">
                                <a
                                    href="#features"
                                    className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-white/10 transition-colors py-2 px-3 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Features
                                </a>
                                <a
                                    href="#pricing"
                                    className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-white/10 transition-colors py-2 px-3 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Pricing
                                </a>
                                <a
                                    href="#contact"
                                    className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-white/10 transition-colors py-2 px-3 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Contact Us
                                </a>
                                <a
                                    href="/documentation"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-white/10 transition-colors py-2 px-3 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Documentation
                                </a>
                                <a
                                    href="https://www.figma.com/design/CXkcqLPtSwft5qe09M41PB/Racoon-Tenancy-App-Wireframes?node-id=86-1687&p=f&t=dOqBec3rr28PU3Fj-0"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-white/10 transition-colors py-2 px-3 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Design Files
                                </a>
                            </nav>
                        </div>
                    </>,
                    document.body
                )}
            </div>
        </header>
    );
};

export default LandingHeader;

