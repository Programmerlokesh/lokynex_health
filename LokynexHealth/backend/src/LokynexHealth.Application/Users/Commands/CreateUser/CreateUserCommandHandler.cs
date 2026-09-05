using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using LokynexHealth.Application.Common.Exceptions;

namespace LokynexHealth.Application.Users.Commands.CreateUser;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public CreateUserCommandHandler(IApplicationDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async Task<Guid> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        // Business rule: username ar email unique hote hobe (schema e UNIQUE constraint already ache,
        // eta app-level e age check kora — jate user-friendly error message dেওয়া jay, raw DB constraint
        // violation exception er poriborte)
        var usernameExists = await _db.Users
            .AnyAsync(u => u.Username == request.Username, cancellationToken);
        if (usernameExists)
            throw new ConflictException($"Username '{request.Username}' already exists.");

        var emailExists = await _db.Users
            .AnyAsync(u => u.Email == request.Email, cancellationToken);
        if (emailExists)
            throw new ConflictException($"Email '{request.Email}' already exists.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Username = request.Username,
            Email = request.Email,
            Phone = request.Phone,
            BranchId = request.BranchId,
            RoleId = request.RoleId,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            Status = RecordStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Users.Add(user);

        foreach (var perm in request.Permissions)
        {
            _db.UserModulePermissions.Add(new UserModulePermission
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                ModuleId = perm.ModuleId,
                CanView = perm.CanView,
                CanCreate = perm.CanCreate,
                CanEdit = perm.CanEdit,
                CanDelete = perm.CanDelete
            });
        }

        await _db.SaveChangesAsync(cancellationToken);

        return user.Id;
    }
}