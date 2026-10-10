import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const ContactSection = ({ sectionRef }) => {
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!contactForm.name.trim()) {
            alert('Please enter your name');
            return;
        }
        if (!contactForm.email.trim()) {
            alert('Please enter your email');
            return;
        }
        
        const subject = encodeURIComponent('Contact Form Inquiry');
        // Use default message if message is empty
        const messageText = contactForm.message.trim() || 'No message provided.';
        const body = encodeURIComponent(
            `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\nMessage:\n${messageText}`
        );
        const mailtoLink = `mailto:contact@raccons.dev?subject=${subject}&body=${body}`;
        window.location.href = mailtoLink;
    };

    return (
        <section id="contact" className="pt-8 py-16 sm:pt-16 sm:py-32 px-4 sm:px-6 lg:px-8 scroll-mt-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-left mb-6 sm:mb-12 md:mb-16" ref={sectionRef}>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2 leading-relaxed">
                        Contact Us
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-500 max-w-2xl leading-relaxed">
                        Get in touch with us. We'd love to hear from you.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
                    {/* Contact Form - Left Side */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/20">
                        <form 
                            className="space-y-6"
                            onSubmit={handleSubmit}
                        >
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-primary mb-2">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    value={contactForm.name}
                                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-black/30 bg-white/20 backdrop-blur-sm text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-primary/60"
                                    placeholder="Your name"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    value={contactForm.email}
                                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-black/30 bg-white/20 backdrop-blur-sm text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-primary/60"
                                    placeholder="your.email@example.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-primary mb-2">
                                    Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    required
                                    rows={5}
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-black/30 bg-white/20 backdrop-blur-sm text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none placeholder:text-primary/60"
                                    placeholder="Your message..."
                                ></textarea>
                            </div>
                            <Button
                                type="submit"
                                className="w-full py-4 sm:py-6 md:py-8 px-6 sm:px-8 rounded-xl sm:rounded-2xl bg-primary text-primary-foreground text-base sm:text-lg md:text-xl font-semibold transition-colors duration-300 hover:opacity-90"
                            >
                                Send Message
                            </Button>
                        </form>
                    </div>

                    {/* Image - Right Side */}
                    <div className="flex justify-center items-center">
                        <img
                            src="/images/dashboard-frame-mob.png"
                            alt="Dashboard Preview"
                            className="w-full h-auto max-w-2xl"
                            style={{
                                mixBlendMode: 'multiply',
                                backgroundColor: 'transparent'
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;

