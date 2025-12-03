'use client'
import Link from 'next/link'
import Image from 'next/image'

export default function CustomerHome() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fcf9da' }}>
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="font-bold text-navy mb-4 font-montserrat uppercase tracking-wider" style={{ fontSize: '3.25rem' }}>
            Hoschailine
          </h1>
          <p className="text-lg md:text-xl text-navy font-medium">
            Order smart. Eat smart.
          </p>
        </div>

        {/* Featured Image */}
        <div className="mb-16">
          <div className="max-w-2xl mx-auto">
            <div className="relative aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <Image
                src="/new-homepage-image.jpg"
                alt="Hoschailine featured image"
                fill
                className="object-cover object-bottom hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 50vw"
              />
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Link
            href="/customer/menu"
            className="inline-block bg-navy text-cream rounded-lg hover:scale-105 hover:shadow-lg transition-all duration-200 font-montserrat uppercase tracking-wide"
            style={{
              paddingTop: '1.75rem',
              paddingBottom: '1.75rem',
              paddingLeft: '1.75rem',
              paddingRight: '1.75rem',
              fontWeight: '800',
              fontSize: '2rem',
              lineHeight: '1rem'
            }}
          >
            Order Now
          </Link>
        </div>
      </div>
    </div>
  )
}
