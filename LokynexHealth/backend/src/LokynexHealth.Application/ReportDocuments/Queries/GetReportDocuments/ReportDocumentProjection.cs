using System.Linq.Expressions;
using LokynexHealth.Domain.Entities;

namespace LokynexHealth.Application.ReportDocuments.Queries.GetReportDocuments;

/// <summary>One projection shared by the list and the single-document query.</summary>
public static class ReportDocumentProjection
{
    public static readonly Expression<Func<ReportDocument, ReportDocumentDto>> ToDto = d => new ReportDocumentDto
    {
        Id = d.Id,
        OrderId = d.OrderItem.OrderId,
        OrderItemId = d.OrderItemId,
        OrderNumber = d.OrderItem.Order.OrderNumber,
        TestName = d.OrderItem.Test.Name,
        DepartmentName = d.OrderItem.Test.Department.Name,
        PatientName = d.OrderItem.Order.Relative != null
            ? d.OrderItem.Order.Relative.Name
            : d.OrderItem.Order.Patient.FullName,
        HeaderContent = d.HeaderContent,
        FooterContent = d.FooterContent,
        BodyContent = d.BodyContent,
        IsDeleted = d.IsDeleted,
        CreatedAt = d.CreatedAt,
        UpdatedAt = d.UpdatedAt
    };
}