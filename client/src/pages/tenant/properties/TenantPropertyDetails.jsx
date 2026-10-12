import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bath, BedDouble, Mail, MapPin, Phone, Send } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import PropertyImage from "@/components/shared/PropertyImage";

export default function TenantPropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [message, setMessage] = useState("I am interested in this property.");

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ["tenant-property", id],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.LISTINGS.BY_ID(id));
      return response.data?.data || response.data;
    },
  });

  const interestMutation = useMutation({
    mutationFn: () => api.post("/api/v1/applications/interest", { listingId: id, message }),
    onSuccess: () => toast.success("Your interest was sent to the landlord."),
    onError: (error) => toast.error(error.response?.data?.message || "Unable to send your interest."),
  });

  if (isLoading) return <main className="p-8">Loading property...</main>;
  if (isError || !property) return <main className="p-8">Property not found.</main>;

  const images = property.images || [];
  const landlordName = `${property.landlord?.firstName || ""} ${property.landlord?.lastName || ""}`.trim() || "Landlord";

  return (
    <main className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <button className="mb-6 flex items-center gap-2 text-primary" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back to properties
      </button>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <div className="h-[420px] overflow-hidden rounded-xl bg-muted">
            <PropertyImage image={images[selectedImage]} alt={property.title} className="h-full" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {images.map((image, index) => (
                <button key={image.id || image.url} className={`h-20 overflow-hidden rounded-lg border-2 ${selectedImage === index ? "border-primary" : "border-transparent"}`} onClick={() => setSelectedImage(index)}>
                  <PropertyImage image={image} alt={`${property.title} ${index + 1}`} className="h-full" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <h1 className="text-3xl font-bold text-primary">{property.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{property.streetAddress}, {property.city}, {property.state} {property.zipCode || ""}</p>
          <p className="mt-5 text-2xl font-bold">${Number(property.rentAmount).toLocaleString()} <span className="text-base font-normal">/ {property.rentCycle?.toLowerCase()}</span></p>

          <div className="mt-6 flex gap-6 text-muted-foreground">
            <span className="flex items-center gap-2"><BedDouble className="h-5 w-5" />{property.bedrooms ?? 0} beds</span>
            <span className="flex items-center gap-2"><Bath className="h-5 w-5" />{property.bathrooms ?? 0} baths</span>
          </div>

          <p className="mt-6 whitespace-pre-line text-muted-foreground">{property.description || "No description provided."}</p>

          {property.amenities?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold">Amenities</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <span key={amenity.id || amenity.name} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                    {amenity.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 rounded-xl border p-5">
            <h2 className="text-lg font-semibold">Contact {landlordName}</h2>
            <div className="mt-3 space-y-2 text-sm">
              {property.landlord?.email && <a className="flex items-center gap-2 text-primary" href={`mailto:${property.landlord.email}`}><Mail className="h-4 w-4" />{property.landlord.email}</a>}
              {property.contactName && <p>{property.contactName}</p>}
              {property.phoneNumber && <a className="flex items-center gap-2 text-primary" href={`tel:${property.phoneNumber}`}><Phone className="h-4 w-4" />{property.phoneNumber}</a>}
            </div>

            <textarea className="mt-5 min-h-24 w-full rounded-lg border p-3" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message to the landlord" />
            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50" onClick={() => interestMutation.mutate()} disabled={interestMutation.isPending}>
              <Send className="h-4 w-4" />{interestMutation.isPending ? "Sending..." : "I'm Interested"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
