import React from 'react';
import { Popup } from 'react-leaflet';
import { Location } from '../types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface CityCardProps {
  location: Location;
  onEdit?: (location: Location) => void;
}

const CityCard: React.FC<CityCardProps> = ({ location, onEdit }) => {
  console.log('🏷️ CityCard rendering with location:', location);
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(location);
  };

  return (
    <Popup>
      {onEdit && (
          <button
            onClick={handleEdit}
            className="absolute top-1 right-1 z-50 p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 text-black rounded-full shadow-lg transition-all duration-200 hover:scale-110 border border-gray-300"
            title="Edit location"
            style={{ transform: 'translate(50%, -50%)' }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
        
      <div className="relative bg-white overflow-hidden">
        {/* Edit button positioned in top-right corner */}
        

        {location.imageUrls && location.imageUrls.length > 0 && (
          <Carousel>
            <CarouselContent>
              {location.imageUrls.map((url) => (
                <CarouselItem key={url} className="w-full max-h-[150px]">
                  <img
                    src={url}
                    alt={location.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute top-1/2 left-4 transform-none" />
            <CarouselNext className="absolute top-1/2 right-4 transform-none" />
          </Carousel>
        )}
        
        <div className="font-serif p-3">
          <h3 className="text-lg font-bold">{location.name}</h3>
          <p className="text-base">{location.description}</p>
          <a
            className="text-center"
            href={location.moreInfoUrl}
            target="_blank"
            rel="noopener noreferrer">
            More Info
          </a>
        </div>
      </div>
    </Popup>
  );
};

export default React.memo(CityCard);
