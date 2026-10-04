using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Departments.Commands.CreateDepartment;

public class CreateDepartmentCommandHandler : IRequestHandler<CreateDepartmentCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public CreateDepartmentCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(CreateDepartmentCommand request, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();

        // Case-insensitive so "Pathology" and "pathology" are not two departments.
        var lower = name.ToLower();
        var exists = await _db.Departments.AnyAsync(d => d.Name.ToLower() == lower, cancellationToken);
        if (exists)
            throw new ConflictException($"Department '{name}' already exists.");

        var department = new Department
        {
            Id = Guid.NewGuid(),
            Name = name,
            Status = RecordStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Departments.Add(department);
        await _db.SaveChangesAsync(cancellationToken);

        return department.Id;
    }
}