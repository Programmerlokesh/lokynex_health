using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Tests.Commands.UpdateTest;

public class UpdateTestCommandHandler : IRequestHandler<UpdateTestCommand>
{
    private readonly IApplicationDbContext _db;

    public UpdateTestCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(UpdateTestCommand request, CancellationToken cancellationToken)
    {
        var test = await _db.Tests.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
                   ?? throw new NotFoundException(nameof(Test), request.Id);

        var name = request.Name.Trim();

        var duplicate = await _db.Tests.AnyAsync(
            t => t.DepartmentId == test.DepartmentId && t.Id != test.Id && t.Name == name, cancellationToken);
        if (duplicate)
            throw new ConflictException($"Test '{name}' already exists in this department.");

        test.Name = name;
        test.Price = request.Price;
        test.DoctorCommissionType = Enum.Parse<CommissionType>(request.DoctorCommissionType);
        test.DoctorCommissionValue = request.DoctorCommissionValue;
        test.ReferralCommissionType = Enum.Parse<CommissionType>(request.ReferralCommissionType);
        test.ReferralCommissionValue = request.ReferralCommissionValue;
        test.TechnicianCommissionType = Enum.Parse<CommissionType>(request.TechnicianCommissionType);
        test.TechnicianCommissionValue = request.TechnicianCommissionValue;

        var newStatus = Enum.Parse<RecordStatus>(request.Status);
        if (newStatus == RecordStatus.Active && test.Status != RecordStatus.Active)
        {
            var parentActive = await _db.Departments.AnyAsync(
                d => d.Id == test.DepartmentId && d.Status == RecordStatus.Active, cancellationToken);
            if (!parentActive)
                throw new ConflictException("The department is Inactive. Activate the department first.");
        }
        test.Status = newStatus;
        test.UpdatedAt = DateTimeOffset.UtcNow;

        await TestCommissionSync.SyncAsync(_db, test, request.Commissions, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }
}