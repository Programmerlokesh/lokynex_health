using MediatR;

namespace LokynexHealth.Application.Tests.Queries.GetTestCommissions;

public class GetTestCommissionsQuery : IRequest<List<TestCommissionDto>>
{
    public Guid TestId { get; set; }
}

public class TestCommissionDto
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = default!;
    public Guid EntityId { get; set; }
    public string EntityName { get; set; } = default!;
    public string CommissionType { get; set; } = default!;
    public decimal CommissionValue { get; set; }
}