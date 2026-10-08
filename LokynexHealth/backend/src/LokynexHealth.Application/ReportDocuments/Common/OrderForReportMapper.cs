using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.ReportDocuments.Queries.GetOrdersForReport;
using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.ReportDocuments.Common;

public static class OrderForReportMapper
{
    /// <summary>One GROUP BY query for all items, then O(1) Dictionary lookups per item.</summary>
    public static async Task<Dictionary<Guid, int>> CountReportsAsync(
        IApplicationDbContext db, IReadOnlyCollection<Guid> itemIds, CancellationToken ct)
    {
        if (itemIds.Count == 0) return new Dictionary<Guid, int>();

        var ids = itemIds.ToList();
        return await db.ReportDocuments
            .AsNoTracking()
            .Where(d => !d.IsDeleted && ids.Contains(d.OrderItemId))
            .GroupBy(d => d.OrderItemId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, ct);
    }

    public static OrderForReportDto Map(Order o, IReadOnlyDictionary<Guid, int> counts)
    {
        var person = o.Relative;
        return new OrderForReportDto
        {
            Id = o.Id,
            OrderNumber = o.OrderNumber,
            PatientName = person?.Name ?? o.Patient.FullName,
            PatientPhone = o.Patient.Phone,
            PatientAge = person is not null ? person.Age : o.Patient.Age,
            PatientGender = (person is not null ? person.Gender : o.Patient.Gender)?.ToString(),
            PatientAddress = o.Patient.Address,
            BranchName = o.Branch?.BranchName,
            BranchAddress = o.Branch?.BranchAddress,
            BranchPhone = o.Branch?.BranchPhone,
            CreatedAt = o.CreatedAt,
            Items = o.Items
                .OrderBy(i => i.CreatedAt).ThenBy(i => i.Test.Name)
                .Select(i => new OrderForReportItemDto
                {
                    Id = i.Id,
                    TestName = i.Test.Name,
                    DepartmentName = i.Test.Department?.Name ?? string.Empty,
                    ReportCount = counts.GetValueOrDefault(i.Id)
                })
                .ToList()
        };
    }
}