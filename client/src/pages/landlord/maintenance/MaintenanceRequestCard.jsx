import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Calendar,
  X,
  Reply,
  Trash2,
  Eye,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import PropertyImage from "@/components/shared/PropertyImage";
import {
  getPriorityDisplayName,
  getCategoryDisplayName,
} from "@/lib/maintenanceApi";

const MaintenanceRequestCard = ({ request, actions, onActionClick, updatingActions = {}, currentUserRole, currentUserId, onCardClick }) => {
  // Filter actions based on who created the request
  const filteredActions = actions.filter((action) => {
    if (action === "Accept") {
      // Hide "Accept" if the request was created by a TENANT and current user is not ADMIN
      if (request.user?.role === "TENANT" && currentUserRole !== "ADMIN") {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="mb-1">
      <Card className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onCardClick?.(request)}>
        <CardHeader className="flex items-center gap-2 px-3 py-2">
          <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
            {request.images?.length ? (
              <PropertyImage
                image={request.images[0]}
                alt={request.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="size-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <CardTitle className="text-sm font-semibold leading-tight mb-0.5">{request.title}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs leading-tight">
              <MapPin className="size-3" />
              {request.listing?.title || "Unknown Property"}
            </CardDescription>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 leading-tight">
              <Calendar className="size-3" />
              {new Date(request.createdAt).toLocaleDateString()} ·
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  request.priority === "URGENT"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    : request.priority === "HIGH"
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {getPriorityDisplayName(request.priority)}
              </span>
            </p>
            {request.user?.id !== currentUserId && (
              <p className="text-xs text-muted-foreground mt-1 leading-tight">
                From: {request.user?.firstName} {request.user?.lastName}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 py-2">
          <p className="text-sm font-medium line-clamp-2">{request.description}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Category: {getCategoryDisplayName(request.category)}
          </p>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 px-3 py-2" onClick={(e) => e.stopPropagation()}>
          {filteredActions.map((action) => {
            const isUpdating = updatingActions[request.id] === action; // check per button

            // Define button colors based on action type using specified color palette
            const getButtonClassName = (action) => {
              const baseClass = "rounded-2xl text-white hover:text-white border";
              switch (action) {
                case "Cancel":
                  return `${baseClass} bg-[#E57667] hover:bg-[#E57667]/90 border-[#E57667]`;
                case "Accept":
                  return `${baseClass} bg-[#53848F] hover:bg-[#53848F]/90 border-[#53848F]`;
                case "Reply":
                  return `${baseClass} bg-[#53848F] hover:bg-[#53848F]/90 border-[#53848F]`;
                case "Finish":
                  return `${baseClass} bg-[#53848F] hover:bg-[#53848F]/90 border-[#53848F]`;
                case "Trash":
                  return `${baseClass} bg-[#E57667] hover:bg-[#E57667]/90 border-[#E57667]`;
                case "View":
                  return `${baseClass} bg-[#53848F] hover:bg-[#53848F]/90 border-[#53848F]`;
                default:
                  return `${baseClass} bg-[#53848F] hover:bg-[#53848F]/90 border-[#53848F]`;
              }
            };

            return (
              <Button
                className={getButtonClassName(action)}
                key={action}
                variant="outline"
                size="sm"
                onClick={() => onActionClick(action, request.id)}
                disabled={isUpdating}
              >
                {action === "Cancel" && <X className="size-3 mr-1" />}
                {action === "Accept" && <Check className="size-3 mr-1" />}
                {action === "Reply" && <Reply className="size-3 mr-1" />}
                {action === "Finish" && <Check className="size-3 mr-1" />}
                {action === "Trash" && <Trash2 className="size-3 mr-1" />}
                {action === "View" && <Eye className="size-3 mr-1" />}
                {action}
              </Button>
            );
          })}
        </CardFooter>
      </Card>
    </div>
  );
};

export default MaintenanceRequestCard;
