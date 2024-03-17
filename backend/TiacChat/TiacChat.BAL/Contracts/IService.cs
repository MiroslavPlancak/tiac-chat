using TiacChat.DAL.Entities;

namespace TiacChat.BAL.Services
{
    public interface IService<T>
    {
        public Task<IEnumerable<T>> GetAllAsync();
        public Task<T> GetByIdAsync(int id);
        public Task<T> CreateAsync(T newObject);
        public Task<T> UpdateAsync(T updatedObject);
        public Task<int?> DeleteAsync(int id);

    }
}