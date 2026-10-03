using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Departments.Commands.DeleteDepartment;

public class DeleteDepartmentCommandHandler : IRequestHandler<DeleteDepartmentCommand>
{
    private readonly IApplicationDbContext _db;

    public DeleteDepartmentCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(DeleteDepartmentCommand request, CancellationToken cancellationToken)
    {
        var department = await _db.Departments
            .Include(d => d.Tests)
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Department), request.Id);

        // Copy the list: removing from the tracked navigation while iterating it can throw.
        var tests = department.Tests.ToList();
        var testIds = tests.Select(t => t.Id).ToList();

        var hasReports = await _db.ReportTemplates.AnyAsync(r => r.DepartmentId == department.Id && !r.IsDeleted, cancellationToken);
        if (hasReports)
            throw new ConflictException(
                $"Department '{department.Name}' is used by a report template. Remove or change the template first.");

        // A test that already appears on an order is part of billing history —
        // deleting it would break invoices/commissions, so we refuse and the
        // user can mark the department Inactive instead.
        if (testIds.Count > 0)
        {
            var usedInOrders = await _db.OrderItems.AnyAsync(i => testIds.Contains(i.TestId), cancellationToken);
            if (usedInOrders)
                throw new ConflictException(
                    $"Department '{department.Name}' has tests that are already used in orders, so it cannot be deleted. Mark it Inactive instead.");

            var overrides = await _db.CommissionOverrides
                .Where(c => testIds.Contains(c.TestId))
                .ToListAsync(cancellationToken);
            _db.CommissionOverrides.RemoveRange(overrides);
            _db.Tests.RemoveRange(tests);
        }

        // Soft-deleted templates still hold the FK — detach them.
        var templates = await _db.ReportTemplates
            .Where(r => r.DepartmentId == department.Id)
            .ToListAsync(cancellationToken);
        foreach (var t in templates) t.DepartmentId = null;

        _db.Departments.Remove(department);
        await _db.SaveChangesAsync(cancellationToken);
    }
}