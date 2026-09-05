using LokynexHealth.Application.Common.Models;
using MediatR;

namespace LokynexHealth.Application.Orders.Queries.GetOrders;

public class GetOrdersQuery : IRequest<PagedResult<OrderDto>>
{
    public DateOnly? DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }
    public Guid? BranchId { get; set; }
    public string? PaymentStatus { get; set; }   // "Any" | "Open" | "Partial" | "Paid"
    public Guid? DepartmentId { get; set; }
    public Guid? TestId { get; set; }
    public string? PatientNameContains { get; set; }
    public string? PatientPhone { get; set; }
    public string? OrderNumber { get; set; }
    public Guid? DoctorId { get; set; }
    public Guid? ReferralId { get; set; }
    public Guid? TechnicianId { get; set; }
    public bool ShowDeleted { get; set; } = false;   // false = normal list, true = "Deleted List" view
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}