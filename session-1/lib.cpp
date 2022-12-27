#include "cinttypes"
#include "cstdio"

extern "C" {
uint64_t double_to_bits(double value) {
    return *reinterpret_cast<uint64_t*>(&value);
}
}