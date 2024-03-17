namespace TiacChat.DAL.Contracts
{
    public interface ICrudRepository<T> where T : class
    {
        public Task<IEnumerable<T>> GetAllAsync();
        public Task<T> GetByIdAsync(int id);
        public Task<T> CreateAsync(T newObject);
        public Task<T> UpdateAsync(T updatedObject);
        public Task<int?> DeleteAsync(int id);
    }
}