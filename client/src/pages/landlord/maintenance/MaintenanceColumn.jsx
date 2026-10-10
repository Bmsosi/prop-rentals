import React from "react";
import MaintenanceRequestCard from "./MaintenanceRequestCard";
import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

const ColumnSkeleton = () => (
  <div className="space-y-1">
    {Array.from({ length: 4 }).map((_, idx) => (
      <div
        key={idx}
        className="bg-card border border-gray-200 rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

const MaintenanceColumn = ({
  title,
  requests,
  loading,
  error = null,
  actions,
  onActionClick,
  updatingActions,
  user,
  onCardClick,
}) => {
  return (
    <div className="space-y-4 bg-gray-200 h-[70vh] p-6 rounded-lg flex flex-col">
      <h2 className="font-semibold text-lg">
        {title} ({requests.length})
      </h2>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <ColumnSkeleton />
        ) : error ? (
          <ErrorState message={error.message || "Something went wrong."} />
        ) : requests.length === 0 ? (
          <EmptyState message={`No ${title.toLowerCase()} requests`} />
        ) : (
          requests.map((request) => (
            <MaintenanceRequestCard
              key={request.id}
              request={request}
              actions={actions}
              onActionClick={onActionClick}
              updatingActions={updatingActions}
              currentUserRole={user.role} // pass user role from parent
              currentUserId={user.id}
              onCardClick={onCardClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MaintenanceColumn;
