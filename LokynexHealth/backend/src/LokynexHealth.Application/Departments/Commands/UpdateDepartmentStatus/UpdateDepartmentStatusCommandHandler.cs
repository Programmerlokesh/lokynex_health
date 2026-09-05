using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Departments.Commands.UpdateDepartmentStatus;

public class UpdateDepartmentStatusCommandHandler : IRequestHandler<UpdateDepartmentStatusCommand>
{
    private readonly IApplicationDbContext _db;

    public UpdateDepartmentStatusCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(UpdateDepartmentStatusCommand request, CancellationToken cancellationToken)
    {
        var department = await _db.Departments
            .Include(d => d.Tests)   // cascade korার jonno Tests lagbe, tai eibar Include mandatory
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (department is null)
            throw new NotFoundException(nameof(Department), request.Id);

        var newStatus = Enum.Parse<RecordStatus>(request.Status);
        department.Status = newStatus;
        department.UpdatedAt = DateTimeOffset.UtcNow;

        // Business rule: Department Inactive hole, niche shob Test-o Inactive hoye jabe (cascade)
        if (newStatus == RecordStatus.Inactive)
        {
            foreach (var test in department.Tests)
            {
                test.Status = RecordStatus.Inactive;
                test.UpdatedAt = DateTimeOffset.UtcNow;
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
    }
}