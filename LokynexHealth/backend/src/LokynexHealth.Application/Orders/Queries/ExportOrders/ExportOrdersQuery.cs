using LokynexHealth.Application.Orders.Queries.GetOrders;
using MediatR;

namespace LokynexHealth.Application.Orders.Queries.ExportOrders;

/// <summary>Same filters as the list, no paging. Feeds the "Download PDF" report.</summary>
public class ExportOrdersQuery : OrderFilterCriteria, IRequest<OrderExportDto>
{
}

public class OrderExportDto
{
    public List<OrderExportRowDto> Rows { get; set; } = new();
    public int TotalOrders { get; set; }
    /// <summary>True when more orders matched than the export limit — narrow the filters.</summary>
    public bool Truncated { get; set; }

    public decimal TotalTestAmount { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal TotalDue { get; set; }
}

public class OrderExportRowDto
{
    public string OrderNumber { get; set; } = default!;
    public DateTimeOffset CreatedAt { get; set; }
    public string PatientName { get; set; } = default!;
    public string? DoctorName { get; set; }
    public string? ReferralName { get; set; }
    public List<OrderExportTestDto> Tests { get; set; } = new();
    public decimal TestAmount { get; set; }
    public decimal Paid { get; set; }
    public decimal Due { get; set; }
}

public class OrderExportTestDto
{
    public string Name { get; set; } = default!;
    public decimal Amount { get; set; }
}