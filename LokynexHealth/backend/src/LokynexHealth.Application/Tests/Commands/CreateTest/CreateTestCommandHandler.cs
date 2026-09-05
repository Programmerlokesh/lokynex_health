using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Tests.Commands.CreateTest;

public class CreateTestCommandHandler : IRequestHandler<CreateTestCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public CreateTestCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(CreateTestCommand request, CancellationToken cancellationToken)
    {
        var departmentExists = await _db.Departments
            .AnyAsync(d => d.Id == request.DepartmentId, cancellationToken);
        if (!departmentExists)
            throw new NotFoundException(nameof(Department), request.DepartmentId);

        var duplicateExists = await _db.Tests
            .AnyAsync(t => t.DepartmentId == request.DepartmentId && t.Name == request.Name, cancellationToken);
        if (duplicateExists)
            throw new ConflictException($"Test '{request.Name}' already exists in this department.");

        var test = new Test
        {
            Id = Guid.NewGuid(),
            DepartmentId = request.DepartmentId,
            Name = request.Name,
            Price = request.Price,
            DoctorCommissionType = Enum.Parse<CommissionType>(request.DoctorCommissionType),
            DoctorCommissionValue = request.DoctorCommissionValue,
            ReferralCommissionType = Enum.Parse<CommissionType>(request.ReferralCommissionType),
            ReferralCommissionValue = request.ReferralCommissionValue,
            TechnicianCommissionType = Enum.Parse<CommissionType>(request.TechnicianCommissionType),
            TechnicianCommissionValue = request.TechnicianCommissionValue,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Tests.Add(test);
        await _db.SaveChangesAsync(cancellationToken);

        return test.Id;
    }
}