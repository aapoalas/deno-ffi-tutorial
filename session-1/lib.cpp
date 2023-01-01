#include "cinttypes"
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <string>

namespace lib {
class Example {
public:
  Example(const char *data) : data_(data) {}

  const char *getCString() const { return data_.c_str(); }

  std::size_t length() const { return data_.length(); }

private:
  std::string data_;
};
} // namespace lib

extern "C" {
uint32_t add_u32(uint32_t a, uint32_t b) { return a + b; }

uint64_t double_to_bits(double value) {
  return *reinterpret_cast<uint64_t *>(&value);
}

double bits_to_double(uint64_t value) {
  return *reinterpret_cast<double *>(&value);
}

lib::Example *lib__Example__create(const char *data) {
  return new lib::Example(data);
}

void lib__Example__delete(lib::Example *example) { delete example; }

void lib__Example__destructure(lib::Example *example) { example->~Example(); }

const char *lib__Example__getCString(const lib::Example *example) {
  return example->getCString();
}

std::size_t lib__Example__length(const lib::Example *example) {
  return example->length();
}
}