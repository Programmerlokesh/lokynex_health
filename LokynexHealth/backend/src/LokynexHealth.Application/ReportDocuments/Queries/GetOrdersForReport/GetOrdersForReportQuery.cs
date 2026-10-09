using LokynexHealth.Application.Common.Models;
using MediatR;

namespace LokynexHealth.Application.ReportDocuments.Queries.GetOrdersForReport;

public class GetOrdersForReportQuery : IRequest<OrdersForReportResult>
{
    /// <summary>Quick search: order no, patient, phone or test.</summary>
    public string? Search { get; set; }

    /// <summary>Any (default) | Pending (some test has no report) | Reported (every test has a report).</summary>
    public string? Status { get; set; }

    /// <summary>Kept for older clients: same as Status = Pending.</summary>
    public bool OnlyPending { get; set; }

    /// <summary>Created at or after this instant.</summary>
    public DateTimeOffset? From { get; set; }

    /// <summary>Created before this instant (exclusive).</summary>
    public DateTimeOffset? To { get; set; }

    public string? PatientName { get; set; }
    public string? Phone { get; set; }
    public string? OrderNumber { get; set; }
    public string? TestName { get; set; }

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 18;
}

public class OrdersForReportResult : PagedResult<OrderForReportDto>
{
    /// <summary>Orders (matching every filter except Status) with at least one test still without a report.</summary>
    public int PendingCount { get; set; }

    /// <summary>Orders (matching every filter except Status) whose tests all have a report.</summary>
    public int ReportedCount { get; set; }
}