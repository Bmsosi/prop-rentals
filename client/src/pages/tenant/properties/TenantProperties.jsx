import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, BedDouble, Bath, Home } from "lucide-react";
import api from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import PropertyImage from "@/components/shared/PropertyImage";

export default function TenantProperties() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("search")?.trim().toLowerCase() || "";
  const { data: properties = [], isLoading, isError } = useQuery({
    queryKey: ["tenant-browse-listings"],
    queryFn: async () => {
      const response = await api.get(`${API_ENDPOINTS.LISTINGS.GET_ALL}?browse=true`);
      return response.data?.listing || response.data?.data || [];
    },
  });

  const filteredProperties = searchTerm
    ? properties.filter((property) =>
        [
          property.title,
          property.city,
          property.state,
          property.propertyType,
          property.address,
          property.description,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchTerm))
      )
    : properties;

  return (
    <main className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6 flex items-center gap-2" aria-label="MucoProps">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-extrabold text-primary-foreground">
          M
        </div>
        <span className="text-xl font-bold tracking-tight text-primary">MucoProps</span>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Available Properties</h1>
        <p className="text-muted-foreground mt-2">
          {searchTerm ? `Search results for “${searchParams.get("search")}"` : "Browse active properties available for rent."}
        </p>
      </div>

      {isLoading && <p>Loading properties...</p>}
      {isError && <p className="text-destructive">Unable to load properties.</p>}
      {!isLoading && !isError && filteredProperties.length === 0 && (
        <div className="rounded-xl border p-10 text-center text-muted-foreground">
          No properties are currently available.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property) => (
          <article key={property.id} className="cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg" onClick={() => navigate(`/tenant/properties/${property.id}`)}>
            <div className="h-52 bg-muted">
              <PropertyImage image={property.images?.[0]} alt={property.title} className="h-full" />
            </div>
            <div className="p-5">
              <h2 className="text-xl font-semibold">{property.title}</h2>
              <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {property.city}, {property.state}
              </p>
              <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Home className="h-4 w-4" />{property.propertyType}</span>
                <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{property.bedrooms ?? 0}</span>
                <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{property.bathrooms ?? 0}</span>
              </div>
              <p className="mt-5 text-lg font-bold text-primary">
                ${Number(property.rentAmount).toLocaleString()} / {property.rentCycle?.toLowerCase()}
              </p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
