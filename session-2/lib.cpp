#include <cmath>
#include <cstdint>
#include <cstdio>
#include <memory>
#include <sys/types.h>
#include <thread>

namespace lib {
uint64_t e = 65537;

enum PrimeSecretValidity {
  Unknown = 0,
  Valid = 1,
  Invalid = 2,
};

class PrimeSecret {
public:
  PrimeSecret(uint64_t a, uint64_t b) : a_{a}, b_{b} {
    thread_a_ =
        std::thread([this, a]() { valid_a_ = PrimeSecret::is_prime(a); });
    thread_b_ =
        std::thread([this, b]() { valid_b_ = PrimeSecret::is_prime(b); });
  }

  ~PrimeSecret() {
    // Must join the other threads before finishing.
    if (thread_a_.joinable()) {
      thread_a_.join();
    }
    if (thread_b_.joinable()) {
      thread_b_.join();
    }
  }

  PrimeSecret(uint64_t seed) {
    uint64_t a_seed_ = rand() * seed / RAND_MAX + 2;
    uint64_t b_seed_ = rand() * seed / RAND_MAX + 2;
    thread_a_ = std::thread([this, a_seed_]() {
      a_ = create_prime(a_seed_);
      valid_a_ = a_ != 0;
    });
    thread_b_ = std::thread([this, b_seed_]() {
      b_ = create_prime(b_seed_);
      valid_b_ = b_ != 0;
    });
  }

  /// Threadsafe
  PrimeSecretValidity is_valid() {
    if (verified_) {
      return valid_a_ && valid_b_ ? PrimeSecretValidity::Valid
                                  : PrimeSecretValidity::Invalid;
    } else {
      return PrimeSecretValidity::Unknown;
    }
  }

  /// Threadsafe
  static bool is_prime(uint64_t candidate) {
    uint64_t root = (uint64_t)floor(sqrt(candidate));
    for (uint64_t i = 2; i < root; i++) {
      if ((candidate % i) == 0) {
        return false;
      }
    }
    return true;
  }

  /// Threadsafe
  static uint64_t create_prime(uint64_t upper_limit) {
    if (upper_limit == 0) {
      return 0;
    }
    if (upper_limit % 2 == 0) {
      upper_limit = upper_limit - 1;
    }
    while (upper_limit > 0) {
      if (is_prime(upper_limit)) {
        return upper_limit;
      }
      upper_limit = upper_limit - 2;
    }
    return 0;
  }

  void wait_for_complete() {
    if (thread_a_.joinable()) {
      thread_a_.join();
    }
    if (thread_b_.joinable()) {
      thread_b_.join();
    }
  }

  uint64_t get_public_key() { return a_; }

  uint64_t get_private_key() { return b_; }

private:
  uint64_t a_;
  uint64_t b_;
  std::thread thread_a_;
  std::thread thread_b_;
  bool verified_;
  bool valid_a_;
  bool valid_b_;
};
} // namespace lib

extern "C" {
/**
 * Determine if \p candidate is prime.
 *
 * Threadsafe
 */
extern bool is_prime(uint64_t candidate) {
  return lib::PrimeSecret::is_prime(candidate);
}

extern void is_prime_cb(uint64_t candidate, void *data,
                        void (*callback)(void *data, bool result)) {
  std::thread t([candidate, data, callback]() {
    bool result = lib::PrimeSecret::is_prime(candidate);
    callback(data, result);
  });
  t.detach();
}

/// Threadsafe
extern uint64_t create_prime(uint64_t upper_limit) {
  return lib::PrimeSecret::create_prime(upper_limit);
}

extern lib::PrimeSecret *lib__PrimeSecret__with_primes(uint64_t a, uint64_t b) {
  return new lib::PrimeSecret(a, b);
}

extern lib::PrimeSecret *lib__PrimeSecret__with_seed(uint64_t seed) {
  return new lib::PrimeSecret(seed);
}

extern lib::PrimeSecret *
lib__PrimeSecret__construct_with_primes(void *pointer, uint64_t a, uint64_t b) {
  return new (pointer) lib::PrimeSecret(a, b);
}

extern lib::PrimeSecret *lib__PrimeSecret__construct_with_seed(void *pointer,
                                                               uint64_t seed) {
  return new (pointer) lib::PrimeSecret(seed);
}

extern void lib__PrimeSecret__wait_for_complete(lib::PrimeSecret *prime_secret) {
  prime_secret->wait_for_complete();
}

extern void lib__PrimeSecret__on_complete(
    lib::PrimeSecret *prime_secret,
    void (*callback)(lib::PrimeSecret *prime_secret)) {
  std::thread t([prime_secret, callback]() {
    prime_secret->wait_for_complete();
    callback(prime_secret);
  });
  t.detach();
}

extern lib::PrimeSecretValidity
lib__PrimeSecret__is_valid(lib::PrimeSecret *prime_secret) {
  return prime_secret->is_valid();
}

extern uint64_t
lib__PrimeSecret__get_public_key(lib::PrimeSecret *prime_secret) {
  return prime_secret->get_public_key();
}

extern uint64_t
lib__PrimeSecret__get_private_key(lib::PrimeSecret *prime_secret) {
  return prime_secret->get_private_key();
}

extern void lib__PrimeSecret__dispose(lib::PrimeSecret *prime_secret) {
  delete prime_secret;
}

extern void lib__PrimeSecret__destruct(lib::PrimeSecret *prime_secret) {
  prime_secret->~PrimeSecret();
}
}